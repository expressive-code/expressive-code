import {
	AnnotationRenderPhaseOrder,
	ExpressiveCodePlugin,
	InlineStyleAnnotation,
	ensureColorContrastOnBackground,
	getStaticBackgroundColor,
	isInlineStyleAnnotation,
	onBackground,
} from '@expressive-code/core'
import rangeParser from 'parse-numeric-range'
import { MarkerType, MarkerTypeOrder, markerTypeFromString } from './marker-types'
import { getTextMarkersBaseStyles, markerBgColorPaths, textMarkersStyleSettings } from './styles'
import { flattenInlineMarkerRanges, getInlineSearchTermMatches } from './inline-markers'
import { TextMarkerAnnotation } from './annotations'
import { toDefinitionsArray } from './utils'
export { TextMarkersStyleSettings } from './styles'

export type MarkerLineOrRange = number | { range: string; label?: string | undefined }

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
}

declare module '@expressive-code/core' {
	export interface ExpressiveCodeBlockProps extends PluginTextMarkersProps {}
}

export function pluginTextMarkers(): ExpressiveCodePlugin {
	return {
		name: 'TextMarkers',
		styleSettings: textMarkersStyleSettings,
		baseStyles: (context) => getTextMarkersBaseStyles(context),
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
						const range = value.replace(/^\s*?(["'])([^\1]+?)\1:\s*?/, (_match, _quote, labelValue: string) => {
							label = labelValue
							return ''
						})
						addDefinition(markerType, { range, label })
					}
				})
				codeBlock.props.useDiffSyntax = codeBlock.metaOptions.getBoolean('useDiffSyntax') ?? codeBlock.props.useDiffSyntax

				// Use props to create line-level annotations for full-line highlighting definitions
				MarkerTypeOrder.forEach((markerType) => {
					toDefinitionsArray(codeBlock.props[markerType]).forEach((definition) => {
						if (typeof definition === 'string' || definition instanceof RegExp) return
						const objDefinition = typeof definition === 'number' ? { range: `${definition}` } : definition
						const { range = '', label } = objDefinition
						const lineNumbers = rangeParser(range)
						lineNumbers.forEach((lineNumber, idx) => {
							const lineIndex = lineNumber - 1
							codeBlock.getLine(lineIndex)?.addAnnotation(
								new TextMarkerAnnotation({
									markerType,
									backgroundColor: cssVar(markerBgColorPaths[markerType]),
									// Add a label to the first line of each consecutive range
									label: idx === 0 || lineNumber - lineNumbers[idx - 1] !== 1 ? label : undefined,
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
