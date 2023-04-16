import { ExpressiveCodePlugin, AttachedPluginData, replaceDelimitedValues, onBackground, ensureReadableColorContrast } from '@expressive-code/core'
import rangeParser from 'parse-numeric-range'
import { visitParents } from 'unist-util-visit-parents'
import { MarkerType, markerTypeFromString } from './marker-types'
import { getMarkerTypeColorsForContrastCalculation, getTextMarkersBaseStyles, textMarkersStyleSettings } from './styles'
import { flattenInlineMarkerRanges, getInlineSearchTermMatches } from './inline-markers'
import { TextMarkerAnnotation } from './annotations'

export interface TextMarkersPluginOptions {
	styleOverrides?: Partial<typeof textMarkersStyleSettings.defaultSettings>
}

export function textMarkers(options: TextMarkersPluginOptions = {}): ExpressiveCodePlugin {
	return {
		name: 'TextMarkers',
		baseStyles: ({ theme, coreStyles }) => getTextMarkersBaseStyles(theme, coreStyles, options.styleOverrides || {}),
		hooks: {
			preprocessMetadata: ({ codeBlock, theme, coreStyles }) => {
				const markerTypeColors = getMarkerTypeColorsForContrastCalculation({
					theme,
					coreStyles,
					styleOverrides: options.styleOverrides,
				})
				const blockData = textMarkersPluginData.getOrCreateFor(codeBlock)

				codeBlock.meta = replaceDelimitedValues(
					codeBlock.meta,
					({ fullMatch, key, value, valueStartDelimiter }) => {
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
			annotateCode: ({ codeBlock, theme, coreStyles }) => {
				const markerTypeColors = getMarkerTypeColorsForContrastCalculation({
					theme,
					coreStyles,
					styleOverrides: options.styleOverrides,
				})
				const blockData = textMarkersPluginData.getOrCreateFor(codeBlock)
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
					// Otherwise, ensure a goot contrast ratio of the text
					const readableTextColor = ensureReadableColorContrast(textColor, combinedBackgroundColor)
					if (readableTextColor.toLowerCase() === textColor.toLowerCase()) return
					node.data.inlineStyleColor = readableTextColor
					node.properties.style = `color:${readableTextColor}`
				})
			},
		},
	}
}

export interface TextMarkerPluginData {
	plaintextTerms: { markerType: MarkerType; text: string }[]
	regExpTerms: { markerType: MarkerType; regExp: RegExp }[]
}

export const textMarkersPluginData = new AttachedPluginData<TextMarkerPluginData>(() => ({ plaintextTerms: [], regExpTerms: [] }))
