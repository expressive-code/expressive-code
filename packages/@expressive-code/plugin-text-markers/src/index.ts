import {
	AttachedPluginData,
	ensureColorContrastOnBackground,
	ExpressiveCodeBlock,
	ExpressiveCodePlugin,
	ExpressiveCodeTheme,
	onBackground,
	replaceDelimitedValues,
	ResolvedCoreStyles,
} from '@expressive-code/core'
import rangeParser from 'parse-numeric-range'
import { visitParents } from 'unist-util-visit-parents'
import { MarkerType, markerTypeFromString } from './marker-types'
import { getMarkerTypeColorsForContrastCalculation, getTextMarkersBaseStyles, textMarkersStyleSettings } from './styles'
import { flattenInlineMarkerRanges, getInlineSearchTermMatches } from './inline-markers'
import { TextMarkerAnnotation } from './annotations'

export interface PluginTextMarkersOptions {
	styleOverrides?: Partial<typeof textMarkersStyleSettings.defaultSettings> | undefined
}

export function pluginTextMarkers(options: PluginTextMarkersOptions = {}): ExpressiveCodePlugin {
	return {
		name: 'TextMarkers',
		baseStyles: ({ theme, coreStyles }) => getTextMarkersBaseStyles(theme, coreStyles, options.styleOverrides || {}),
		hooks: {
			preprocessMetadata: ({ codeBlock, theme, coreStyles }) => {
				const { blockData, markerTypeColors } = getBlockDataAndMarkerTypeColors(codeBlock, theme, coreStyles, options)

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
										backgroundColor: markerTypeColors[markerType],
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
			preprocessCode: ({ codeBlock, theme, coreStyles }) => {
				const { blockData, markerTypeColors } = getBlockDataAndMarkerTypeColors(codeBlock, theme, coreStyles, options)

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
										backgroundColor: markerTypeColors[markerType],
									})
								)
							}
						})
					}
				}
			},
			annotateCode: ({ codeBlock, theme, coreStyles }) => {
				const { blockData, markerTypeColors } = getBlockDataAndMarkerTypeColors(codeBlock, theme, coreStyles, options)

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
								backgroundColor: markerTypeColors[markerType],
								inlineRange: {
									columnStart: start,
									columnEnd: end,
								},
							})
						)
					})
				})
			},
			postprocessRenderedLine: ({ renderData, theme, coreStyles }) => {
				const backgroundColor = coreStyles.codeBackground[0] === '#' ? coreStyles.codeBackground : theme.bg
				visitParents(renderData.lineAst, (node, ancestors) => {
					if (node.type !== 'element' || !node.properties || !node.data) return
					const textColor = typeof node.data.inlineStyleColor === 'string' ? node.data.inlineStyleColor : undefined
					if (!textColor) return
					// Mix combined background color from ancestor chain
					let combinedBackgroundColor = backgroundColor
					ancestors.forEach((ancestor) => {
						const markerBackgroundColor = typeof ancestor.data?.textMarkersBackgroundColor === 'string' ? ancestor.data.textMarkersBackgroundColor : undefined
						if (!markerBackgroundColor) return
						combinedBackgroundColor = onBackground(markerBackgroundColor, combinedBackgroundColor)
					})
					// Abort if the resulting background color is the same as the default
					if (combinedBackgroundColor === backgroundColor) return
					// Otherwise, ensure a good contrast ratio of the text
					const readableTextColor = ensureColorContrastOnBackground(textColor, combinedBackgroundColor)
					if (readableTextColor.toLowerCase() === textColor.toLowerCase()) return
					node.data.inlineStyleColor = readableTextColor
					node.properties.style = `color:${readableTextColor}${node.properties.style?.toString().replace(/^(color:[^;]+)(;|$)/, '$2') || ''}`
				})
			},
		},
	}
}

function getBlockDataAndMarkerTypeColors(codeBlock: ExpressiveCodeBlock, theme: ExpressiveCodeTheme, coreStyles: ResolvedCoreStyles, options: PluginTextMarkersOptions) {
	const blockData = pluginTextMarkersData.getOrCreateFor(codeBlock)
	if (!blockData.markerTypeColors) {
		blockData.markerTypeColors = getMarkerTypeColorsForContrastCalculation({
			theme,
			coreStyles,
			styleOverrides: options.styleOverrides,
		})
	}
	return { blockData, markerTypeColors: blockData.markerTypeColors }
}

export interface PluginTextMarkersData {
	plaintextTerms: { markerType: MarkerType; text: string }[]
	regExpTerms: { markerType: MarkerType; regExp: RegExp }[]
	markerTypeColors?: ReturnType<typeof getMarkerTypeColorsForContrastCalculation> | undefined
	originalLanguage?: string | undefined
}

export const pluginTextMarkersData = new AttachedPluginData<PluginTextMarkersData>(() => ({ plaintextTerms: [], regExpTerms: [] }))
