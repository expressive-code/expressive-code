import {
	AnnotationRenderPhaseOrder,
	type AnnotationCommentHandler,
	type ExpressiveCodeBlock,
	ExpressiveCodePlugin,
	InlineStyleAnnotation,
	ensureColorContrastOnBackground,
	getStaticBackgroundColor,
	isInlineStyleAnnotation,
	onBackground,
} from '@expressive-code/core'
import { addClassName, select, type Element } from '@expressive-code/core/hast'
import rangeParser from 'parse-numeric-range'
import type { MarkerType } from './marker-types'
import { MarkerTypeOrder, markerTypeFromString } from './marker-types'
import { getTextMarkersBaseStyles, markerBgColorPaths, textMarkersStyleSettings } from './styles'
import { flattenInlineMarkerRanges, getInlineSearchTermMatches } from './inline-markers'
import { createLabelHast, normalizeLabelContent, TextMarkerAnnotation, type TextMarkerCopyCommentSyntax } from './annotations'
import { toDefinitionsArray } from './utils'
export type { TextMarkersStyleSettings } from './styles'

export type MarkerLineOrRange = number | { range: string; label?: string | undefined }
export type DelMarkerCopyBehavior = 'remove' | 'comment' | 'keep'

/**
 * A single text marker definition that can be used in the `mark`, `ins`, and `del` props
 * to define text and line markers.
 */
export type MarkerDefinition = string | RegExp | MarkerLineOrRange

export interface PluginTextMarkersProps {
	/**
	 * Defines the code block's [text & line markers](https://expressive-code.com/key-features/text-markers/)
	 * of the default neutral type.
	 *
	 * You can either pass a single marker definition or an array of them.
	 */
	mark: MarkerDefinition | MarkerDefinition[]
	/**
	 * Defines the code block's [text & line markers](https://expressive-code.com/key-features/text-markers/)
	 * of the "inserted" type.
	 *
	 * You can either pass a single marker definition or an array of them.
	 */
	ins: MarkerDefinition | MarkerDefinition[]
	/**
	 * Defines the code block's [text & line markers](https://expressive-code.com/key-features/text-markers/)
	 * of the "deleted" type.
	 *
	 * You can either pass a single marker definition or an array of them.
	 */
	del: MarkerDefinition | MarkerDefinition[]
	/**
	 * Allows you to enable processing of diff syntax for non-diff languages.
	 *
	 * If set to `true`, you can prefix lines with `+` or `-`, no matter what the language of
	 * the code block is. The prefixes will be removed and the lines will be highlighted as
	 * inserted or deleted lines.
	 */
	useDiffSyntax: boolean
	/**
	 * Controls how deleted targets are represented in copied plaintext code.
	 *
	 * This applies to all deleted markers, including markers created from annotation
	 * comments, marker metadata, and diff syntax.
	 *
	 * - `remove`: Deleted targets are removed from copied code.
	 * - `comment`: Full deleted lines are commented out in copied code.
	 *   Inline deleted targets are still removed.
	 * - `keep`: Deleted targets remain unchanged in copied code.
	 *
	 * This can be configured per block or globally via engine `defaultProps`.
	 *
	 * @default 'remove'
	 */
	delCopyBehavior: DelMarkerCopyBehavior
}

declare module '@expressive-code/core' {
	export interface ExpressiveCodeBlockProps extends PluginTextMarkersProps {}
}

export function pluginTextMarkers(): ExpressiveCodePlugin {
	return {
		name: 'TextMarkers',
		styleSettings: textMarkersStyleSettings,
		baseStyles: (context) => getTextMarkersBaseStyles(context),
		annotationCommentHandlers: [
			createTextMarkerAnnotationCommentHandler({
				markerType: 'mark',
				tagNames: ['mark'],
			}),
			createTextMarkerAnnotationCommentHandler({
				markerType: 'ins',
				tagNames: ['ins', 'add', '+'],
			}),
			createTextMarkerAnnotationCommentHandler({
				markerType: 'del',
				tagNames: ['del', 'rem', '-'],
			}),
		],
		hooks: {
			preprocessLanguage: ({ codeBlock }) => {
				// If a "lang" option was given and the code block's language is "diff",
				// use the "lang" value as the new syntax highlighting language instead
				// and set the `useDiffSyntax` prop
				const lang = codeBlock.metaOptions.getString('lang')
				if (lang && codeBlock.language === 'diff') {
					codeBlock.language = lang
					codeBlock.props.useDiffSyntax = true
				}
			},
			preprocessMetadata: ({ codeBlock, cssVar }) => {
				const addDefinition = (target: MarkerType, definition: MarkerDefinition) => {
					const definitions = toDefinitionsArray(codeBlock.props[target])
					definitions.push(definition)
					codeBlock.props[target] = definitions
				}

				// Transfer meta options (if any) to props
				codeBlock.metaOptions.list([...MarkerTypeOrder, '', 'add', 'rem']).forEach((option) => {
					const { kind, key, value } = option
					const markerType = markerTypeFromString(key || 'mark')
					if (!markerType) return

					if (kind === 'string' || kind === 'regexp') addDefinition(markerType, value)
					if (kind === 'range') {
						// Detect an optional label prefix in double or single quotes: `{"1":3-5}`
						let label: string | undefined = undefined
						const range = value.replace(/^\s*?(["'])((?:(?!\1).)+?)\1:\s*?/, (_match, _quote, labelValue: string) => {
							label = labelValue
							return ''
						})
						addDefinition(markerType, { range, label })
					}
				})
				codeBlock.props.useDiffSyntax = codeBlock.metaOptions.getBoolean('useDiffSyntax') ?? codeBlock.props.useDiffSyntax
				codeBlock.props.delCopyBehavior = parseDelMarkerCopyBehavior(codeBlock.metaOptions.getString('delCopyBehavior')) ?? codeBlock.props.delCopyBehavior

				// Use props to create line-level annotations for full-line highlighting definitions
				MarkerTypeOrder.forEach((markerType) => {
					toDefinitionsArray(codeBlock.props[markerType]).forEach((definition) => {
						if (typeof definition === 'string' || definition instanceof RegExp) return
						const objDefinition = typeof definition === 'number' ? { range: `${definition}` } : definition
						const { range = '', label } = objDefinition
						const lineNumbers = rangeParser(range)
						lineNumbers.forEach((lineNumber, idx) => {
							const lineIndex = lineNumber - 1
							const line = codeBlock.getLine(lineIndex)
							if (!line) return
							// If a label was given, only show it at the beginning of each range
							const labelForLine = idx === 0 || lineNumber - lineNumbers[idx - 1] !== 1 ? label : undefined
							const labelRenderMode = resolveLabelRenderMode({
								label: labelForLine,
								hasTargets: true,
								allowBetweenLinesWithoutTargetLineText: false,
								targetLineText: line.text,
							})
							if (labelRenderMode === 'between-lines' && labelForLine) {
								line.addRenderTransform({
									type: 'insert',
									position: 'before',
									onDeleteLine: 'stick-next',
									render: ({ renderEmptyLine }) => {
										const emptyLine = renderEmptyLine()
										prepareLabelLine({ lineAst: emptyLine.lineAst, isGeneratedLine: true, markerType })
										emptyLine.codeWrapper.children.unshift(createLabelHast(labelForLine))
										return emptyLine.lineAst
									},
								})
							}
							line.addAnnotation(
								new TextMarkerAnnotation({
									markerType,
									backgroundColor: cssVar(markerBgColorPaths[markerType]),
									label: labelRenderMode === 'inline' ? labelForLine : undefined,
								})
							)
						})
					})
				})
			},
			preprocessCode: ({ codeBlock, cssVar }) => {
				// Perform special handling of code marked with the language "diff"
				// or with the `useDiffSyntax` prop set to true:
				// - This language is often used as a widely supported format for highlighting
				//   changes to code. In this case, the code is not actually a diff,
				//   but another language with some lines prefixed by `+` or `-`.
				// - We try to detect this case and convert the prefixed lines to annotations
				// - To prevent modifying actual diff files (which would make them invalid),
				//   we ensure that the code does not begin like a real diff:
				//   - The first lines must not start with `*** `, `+++ `, `--- `, `@@ `,
				//     or the default mode location syntax (e.g. `0a1`, `1,2c1,2`, `1,2d1`).
				if (codeBlock.language === 'diff' || codeBlock.props.useDiffSyntax) {
					const lines = codeBlock.getLines()

					// Ensure that the first lines do not look like actual diff output
					const couldBeRealDiffFile = lines.slice(0, 4).some((line) => line.text.match(/^([*+-]{3}\s|@@\s|[0-9,]+[acd][0-9,]+\s*$)/))
					if (!couldBeRealDiffFile) {
						let minIndentation = Infinity
						const parsedLines = lines.map((line) => {
							const [, indentation, marker, content] = line.text.match(/^(([+-](?![+-]))?\s*)(.*)$/) || []
							const markerType: MarkerType | undefined = marker === '+' ? 'ins' : marker === '-' ? 'del' : undefined

							// As it's common to indent unchanged lines to match the indentation
							// of changed lines, and we don't want extra whitespace in the output,
							// we remember the minimum indentation of all non-empty lines
							if (content.trim().length > 0 && indentation.length < minIndentation) minIndentation = indentation.length

							return {
								line,
								markerType,
							}
						})

						parsedLines.forEach(({ line, markerType }) => {
							// Remove line prefixes:
							// - If minIndentation is > 0, we remove minIndentation
							// - Otherwise, if the current line starts with a marker character,
							//   we remove this single character
							const colsToRemove = minIndentation || (markerType ? 1 : 0)
							if (colsToRemove > 0) line.editText(0, colsToRemove, '')

							// If we found a diff marker, add a line annotation
							if (markerType) {
								line.addAnnotation(
									new TextMarkerAnnotation({
										markerType,
										backgroundColor: cssVar(markerBgColorPaths[markerType]),
									})
								)
							}
						})
					}
				}
			},
			annotateCode: ({ codeBlock, cssVar }) => {
				codeBlock.getLines().forEach((line) => {
					// Check the line text for search term matches and collect their ranges
					const markerRanges = getInlineSearchTermMatches(line.text, codeBlock)
					if (!markerRanges.length) return

					// Flatten marked ranges to prevent any overlaps
					const flattenedRanges = flattenInlineMarkerRanges(markerRanges)

					// Add annotations for all flattened ranges
					flattenedRanges.forEach(({ markerType, start, end }) => {
						line.addAnnotation(
							new TextMarkerAnnotation({
								markerType,
								backgroundColor: cssVar(markerBgColorPaths[markerType]),
								inlineRange: {
									columnStart: start,
									columnEnd: end,
								},
							})
						)
					})
				})
			},
			postprocessAnnotations: ({ codeBlock, styleVariants, config }) => {
				applyDeletedMarkerCopyTransformsForBlock(codeBlock)
				if (config.minSyntaxHighlightingColorContrast <= 0) return
				codeBlock.getLines().forEach((line) => {
					const annotations = line.getAnnotations()
					// Determine the highest-priority full line marker
					// and collect all inline markers
					const markers: TextMarkerAnnotation[] = []
					let fullLineMarker: TextMarkerAnnotation | undefined = undefined
					for (const annotation of annotations) {
						if (!(annotation instanceof TextMarkerAnnotation)) continue
						if (annotation.inlineRange) {
							markers.push(annotation)
							continue
						}
						if (fullLineMarker) {
							if (MarkerTypeOrder.indexOf(annotation.markerType) < MarkerTypeOrder.indexOf(fullLineMarker.markerType)) continue
							if (AnnotationRenderPhaseOrder.indexOf(annotation.renderPhase || 'normal') < AnnotationRenderPhaseOrder.indexOf(fullLineMarker.renderPhase || 'normal')) continue
						}
						fullLineMarker = annotation
					}
					// Prepend the highest-priority full line marker to the inline markers
					if (fullLineMarker) markers.unshift(fullLineMarker)
					// Ensure color contrast for all style variants
					styleVariants.forEach((styleVariant, styleVariantIndex) => {
						const fullLineMarkerBgColor = (fullLineMarker && styleVariant.resolvedStyleSettings.get(markerBgColorPaths[fullLineMarker.markerType])) || 'transparent'
						const lineBgColor = onBackground(fullLineMarkerBgColor, getStaticBackgroundColor(styleVariant))
						// Collect inline style annotations that change the text color
						const textColors = annotations.filter(
							(annotation) =>
								isInlineStyleAnnotation(annotation) &&
								annotation.color &&
								// Only consider annotations that apply to the current style variant
								(annotation.styleVariantIndex === undefined || annotation.styleVariantIndex === styleVariantIndex)
						) as InlineStyleAnnotation[]
						// Go through all text color annotations
						textColors.forEach((textColor) => {
							const textFgColor = textColor.color
							const textStart = textColor.inlineRange?.columnStart
							const textEnd = textColor.inlineRange?.columnEnd
							if (textFgColor === undefined || textStart === undefined || textEnd === undefined) return
							// Go through all markers
							markers.forEach((marker) => {
								const markerStart = marker.inlineRange?.columnStart ?? 0
								const markerEnd = marker.inlineRange?.columnEnd ?? line.text.length
								// Skip if the marker does not overlap the text color annotation
								if (markerStart > textEnd || markerEnd < textStart) return
								// Determine the final background color of the overlapping range,
								// which is the line background color that may be overlapped by
								// an inline marker color
								const inlineMarkerBgColor = (marker.inlineRange && styleVariant.resolvedStyleSettings.get(markerBgColorPaths[marker.markerType])) || 'transparent'
								const combinedBgColor = onBackground(inlineMarkerBgColor, lineBgColor)
								// Now ensure a good contrast ratio of the text
								const readableTextColor = ensureColorContrastOnBackground(textFgColor, combinedBgColor, config.minSyntaxHighlightingColorContrast)
								if (readableTextColor.toLowerCase() === textFgColor.toLowerCase()) return
								// If the text color is not readable enough, add an annotation
								// with better contrast for the overlapping range
								line.addAnnotation(
									new InlineStyleAnnotation({
										styleVariantIndex,
										inlineRange: {
											columnStart: Math.max(textStart, markerStart),
											columnEnd: Math.min(textEnd, markerEnd),
										},
										color: readableTextColor,
										renderPhase: 'earlier',
									})
								)
							})
						})
					})
				})
			},
		},
	}
}

function createTextMarkerAnnotationCommentHandler(options: { markerType: MarkerType; tagNames: string[] }): AnnotationCommentHandler {
	const { markerType, tagNames } = options

	return {
		tagNames,
		content: {
			displayCode: 'remove',
			copyCode: 'remove',
			render: {
				placement: ({ annotationComment, targets, content }) => {
					const label = normalizeLabelContent(content.lines)
					const labelRenderMode = resolveLabelRenderMode({
						label,
						hasTargets: targets.length > 0,
						allowBetweenLinesWithoutTargetLineText: true,
					})
					if (labelRenderMode === 'none') return false
					const targetsAbove = areAnyTargetsAboveAnnotationLine(targets, annotationComment.tag.range.start.line)
					return {
						anchor: targets.length ? (targetsAbove ? 'lastTarget' : 'firstTarget') : 'annotation',
						line: labelRenderMode === 'between-lines' ? (targetsAbove ? 'after' : 'before') : 'current',
						col: 'lineStart',
					}
				},
				contentWrapper: ({ content }) => createLabelHast(content.lines),
				parentLine: ({ lineAst, isGeneratedLine }) => {
					prepareLabelLine({ lineAst, isGeneratedLine, markerType })
				},
			},
		},
		handle: ({ targets, annotationComment, cssVar }) => {
			const copyCommentSyntax = markerType === 'del' ? annotationComment.commentSyntax : undefined
			targets.forEach((target) => {
				target.line.addAnnotation(
					new TextMarkerAnnotation({
						markerType,
						backgroundColor: cssVar(markerBgColorPaths[markerType]),
						inlineRange: target.inlineRange,
						copyCommentSyntax,
					})
				)
			})
		},
	}
}

function prepareLabelLine(options: { lineAst: Element; isGeneratedLine: boolean; markerType: MarkerType }) {
	const { lineAst, isGeneratedLine, markerType } = options
	addClassName(lineAst, 'has-label')
	if (!isGeneratedLine) return

	addClassName(lineAst, 'highlight')
	addClassName(lineAst, 'tm-between')
	addClassName(lineAst, markerType)

	// To ensure the line height is correct even if the label is the only content in the line,
	// we add a newline text node to the code wrapper if it was generated as an empty line
	select('.code', lineAst)?.children.push({ type: 'text', value: '\n' })
}

function shouldRenderLabelBetweenLines(label = ''): label is string {
	return label.trim().length > 2
}

function areAnyTargetsAboveAnnotationLine(targets: { lineIndex: number }[], annotationLineIndex: number) {
	return targets.some((target) => target.lineIndex < annotationLineIndex)
}

function resolveLabelRenderMode(options: { label: string | undefined; hasTargets: boolean; allowBetweenLinesWithoutTargetLineText: boolean; targetLineText?: string | undefined }) {
	const { label, hasTargets, allowBetweenLinesWithoutTargetLineText, targetLineText } = options
	if (!label) return 'none' as const
	if (!hasTargets) return 'between-lines' as const
	if (!shouldRenderLabelBetweenLines(label)) return 'inline' as const
	// Before the release of annotation comment support, rendering labels
	// between lines was not possible. Authors had to insert empty lines
	// into the code plaintext and assign a label to them.
	// To avoid breaking the layout of sites using this old approach,
	// we only allow between-line rendering if the line is not empty.
	if (allowBetweenLinesWithoutTargetLineText) return 'between-lines' as const
	return targetLineText?.trim() ? ('between-lines' as const) : ('inline' as const)
}

function parseDelMarkerCopyBehavior(rawValue: string | undefined): DelMarkerCopyBehavior | undefined {
	const normalizedValue = rawValue?.trim().toLowerCase()
	if (!normalizedValue) return undefined
	if (normalizedValue === 'remove' || normalizedValue === 'comment' || normalizedValue === 'keep') return normalizedValue
	return undefined
}

function getDelMarkerCopyBehavior(codeBlock: ExpressiveCodeBlock): DelMarkerCopyBehavior {
	return parseDelMarkerCopyBehavior(codeBlock.props.delCopyBehavior as string | undefined) ?? 'remove'
}

function applyDeletedMarkerCopyTransformsForBlock(codeBlock: ExpressiveCodeBlock) {
	const copyBehavior = getDelMarkerCopyBehavior(codeBlock)
	if (copyBehavior === 'keep') return

	codeBlock.getLines().forEach((line) => {
		const deletedMarkers = line
			.getAnnotations()
			.filter((annotation): annotation is TextMarkerAnnotation => annotation instanceof TextMarkerAnnotation && annotation.markerType === 'del')
		if (!deletedMarkers.length) return

		const fullLineMarkers = deletedMarkers.filter((marker) => !marker.inlineRange)
		if (fullLineMarkers.length > 0) {
			if (copyBehavior === 'remove') {
				line.addCopyTransform({
					type: 'removeLine',
				})
				return
			}
			const commentSyntax = fullLineMarkers.find((marker) => marker.copyCommentSyntax)?.copyCommentSyntax ?? defaultCopyCommentSyntax
			line.addCopyTransform({
				type: 'editText',
				newText: commentOutLine(line.text, commentSyntax),
			})
			return
		}

		const mergedInlineRanges = mergeInlineRanges(deletedMarkers.flatMap((marker) => (marker.inlineRange ? [marker.inlineRange] : [])))
		mergedInlineRanges.forEach((inlineRange) => {
			line.addCopyTransform({
				type: 'editText',
				inlineRange,
				newText: '',
			})
		})
	})
}

function mergeInlineRanges(ranges: { columnStart: number; columnEnd: number }[]) {
	if (!ranges.length) return []
	const normalizedRanges = ranges
		.map(({ columnStart, columnEnd }) => ({
			columnStart: Math.min(columnStart, columnEnd),
			columnEnd: Math.max(columnStart, columnEnd),
		}))
		.filter(({ columnStart, columnEnd }) => columnEnd > columnStart)
		.sort((a, b) => {
			if (a.columnStart !== b.columnStart) return a.columnStart - b.columnStart
			return a.columnEnd - b.columnEnd
		})
	if (!normalizedRanges.length) return []

	const mergedRanges = [normalizedRanges[0]]
	for (const range of normalizedRanges.slice(1)) {
		const previousRange = mergedRanges[mergedRanges.length - 1]
		if (range.columnStart <= previousRange.columnEnd) {
			previousRange.columnEnd = Math.max(previousRange.columnEnd, range.columnEnd)
			continue
		}
		mergedRanges.push({ ...range })
	}
	return mergedRanges
}

const defaultCopyCommentSyntax: TextMarkerCopyCommentSyntax = {
	opening: '//',
}

function commentOutLine(lineText: string, commentSyntax: TextMarkerCopyCommentSyntax) {
	const { opening, closing } = commentSyntax
	const lineMatch = lineText.match(/^(\s*)(.*)$/)
	const indentation = lineMatch?.[1] ?? ''
	const content = lineMatch?.[2] ?? ''
	const trimmedContent = content.trim()

	if (!closing) {
		return `${indentation}${opening}${trimmedContent ? ` ${trimmedContent}` : ''}`
	}
	return `${indentation}${opening}${trimmedContent ? ` ${trimmedContent} ` : ' '}${closing}`.trimEnd()
}
