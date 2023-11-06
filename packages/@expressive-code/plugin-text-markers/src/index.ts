import {
	AnnotationRenderPhaseOrder,
	AttachedPluginData,
	ExpressiveCodePlugin,
	InlineStyleAnnotation,
	ensureColorContrastOnBackground,
	onBackground,
	replaceDelimitedValues,
} from '@expressive-code/core'
import rangeParser from 'parse-numeric-range'
import { MarkerType, MarkerTypeOrder, markerTypeFromString } from './marker-types'
import { getTextMarkersBaseStyles, markerBgColorPaths, textMarkersStyleSettings } from './styles'
import { flattenInlineMarkerRanges, getInlineSearchTermMatches } from './inline-markers'
import { TextMarkerAnnotation } from './annotations'
export { TextMarkersStyleSettings } from './styles'

export function pluginTextMarkers(): ExpressiveCodePlugin {
	return {
		name: 'TextMarkers',
		styleSettings: textMarkersStyleSettings,
		baseStyles: (context) => getTextMarkersBaseStyles(context),
		hooks: {
			preprocessMetadata: ({ codeBlock, cssVar }) => {
				const blockData = pluginTextMarkersData.getOrCreateFor(codeBlock)

				codeBlock.meta = replaceDelimitedValues(
					codeBlock.meta,
					({ fullMatch, key, value, valueStartDelimiter }) => {
						// If we found a "lang" key and the code block's language is "diff",
						// use the "lang" value as the new syntax highlighting language instead
						if (key === 'lang' && codeBlock.language === 'diff') {
							codeBlock.language = value
							blockData.originalLanguage = 'diff'
							return ''
						}

						// Try to identify the marker type from the key
						const markerType = markerTypeFromString(key || 'mark')

						// If an unknown key was encountered, leave this meta string part untouched
						if (!markerType) return fullMatch

						// Handle full-line highlighting definitions
						if (valueStartDelimiter === '{') {
							const lineNumbers = rangeParser(value)
							lineNumbers.forEach((lineNumber) => {
								const lineIndex = lineNumber - 1
								codeBlock.getLine(lineIndex)?.addAnnotation(
									new TextMarkerAnnotation({
										markerType,
										backgroundColor: cssVar(markerBgColorPaths[markerType]),
									})
								)
							})
							return ''
						}

						// Handle regular expression search terms
						if (valueStartDelimiter === '/') {
							// Remember the term for highlighting in a later hook
							let regExp: RegExp | undefined
							try {
								// Try to use regular expressions with capture group indices
								regExp = new RegExp(value, 'gd')
								/* c8 ignore start */
							} catch (error) {
								// Use fallback if unsupported
								regExp = new RegExp(value, 'g')
							}
							/* c8 ignore stop */
							blockData.regExpTerms.push({
								markerType,
								regExp,
							})
							return ''
						}

						// Treat everything else as a plaintext search term and
						// remember it for highlighting in a later hook
						blockData.plaintextTerms.push({
							markerType,
							text: value,
						})
						return ''
					},
					{
						valueDelimiters: ['"', "'", '/', '{...}'],
						keyValueSeparator: '=',
					}
				)
			},
			preprocessCode: ({ codeBlock, cssVar }) => {
				const blockData = pluginTextMarkersData.getOrCreateFor(codeBlock)

				// Perform special handling of code marked with the language "diff":
				// - This language is often used as a widely supported format for highlighting
				//   changes to code. In this case, the code is not actually a diff,
				//   but another language with some lines prefixed by `+` or `-`.
				// - We try to detect this case and convert the prefixed lines to annotations
				// - To prevent modifying actual diff files (which would make them invalid),
				//   we ensure that the code does not begin like a real diff:
				//   - The first lines must not start with `*** `, `+++ `, `--- `, `@@ `,
				//     or the default mode location syntax (e.g. `0a1`, `1,2c1,2`, `1,2d1`).
				if ((blockData.originalLanguage ?? codeBlock.language) === 'diff') {
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
				const blockData = pluginTextMarkersData.getOrCreateFor(codeBlock)

				codeBlock.getLines().forEach((line) => {
					// Check the line text for search term matches and collect their ranges
					const markerRanges = getInlineSearchTermMatches(line.text, blockData)
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
							if (AnnotationRenderPhaseOrder.indexOf(annotation.renderPhase) < AnnotationRenderPhaseOrder.indexOf(fullLineMarker.renderPhase)) continue
						}
						fullLineMarker = annotation
					}
					// Prepend the highest-priority full line marker to the inline markers
					if (fullLineMarker) markers.unshift(fullLineMarker)
					// Ensure color contrast for all style variants
					styleVariants.forEach((styleVariant, styleVariantIndex) => {
						const lineBgColor =
							(fullLineMarker ? styleVariant.resolvedStyleSettings.get(markerBgColorPaths[fullLineMarker.markerType]) : styleVariant.resolvedStyleSettings.get('codeBackground')) ||
							styleVariant.theme.bg
						// Collect inline style annotations that change the text color
						const textColors = annotations.filter(
							(annotation) =>
								annotation instanceof InlineStyleAnnotation &&
								// Only consider annotations for the current style variant
								annotation.styleVariantIndex === styleVariantIndex &&
								annotation.color
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
								if (markerStart > textEnd || markerEnd < textStart) return
								// As the marker overlaps with the text color annotation,
								// determine the combined background color of this range
								const markerBgColor = styleVariant.resolvedStyleSettings.get(markerBgColorPaths[marker.markerType]) ?? ''
								const combinedBgColor = onBackground(markerBgColor, lineBgColor)
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

export interface PluginTextMarkersData {
	plaintextTerms: { markerType: MarkerType; text: string }[]
	regExpTerms: { markerType: MarkerType; regExp: RegExp }[]
	originalLanguage?: string | undefined
}

export const pluginTextMarkersData = new AttachedPluginData<PluginTextMarkersData>(() => ({ plaintextTerms: [], regExpTerms: [] }))
