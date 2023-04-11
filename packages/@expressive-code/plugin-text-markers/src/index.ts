import { ExpressiveCodePlugin, AttachedPluginData, replaceDelimitedValues, addClass } from '@expressive-code/core'
import { h } from 'hastscript'
import rangeParser from 'parse-numeric-range'
import { MarkerType, markerTypeFromString } from './marker-types'
import { getTextMarkersBaseStyles } from './styles'
import { flattenInlineMarkerRanges, getInlineSearchTermMatches } from './inline-markers'

export interface TextMarkerPluginData {
	plaintextTerms: { markerType: MarkerType; text: string }[]
	regExpTerms: { markerType: MarkerType; regExp: RegExp }[]
}

export const textMarkersPluginData = new AttachedPluginData<TextMarkerPluginData>(() => ({ plaintextTerms: [], regExpTerms: [] }))

export function textMarkers(): ExpressiveCodePlugin {
	return {
		name: 'TextMarkers',
		baseStyles: ({ theme, coreStyles }) => getTextMarkersBaseStyles(theme, coreStyles, {}),
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
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
								codeBlock.getLine(lineIndex)?.addAnnotation({
									name: markerType,
									render: ({ nodesToTransform }) => {
										return nodesToTransform.map((node) => {
											addClass(node, markerType)
											return node
										})
									},
								})
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
			annotateCode: ({ codeBlock }) => {
				const blockData = textMarkersPluginData.getOrCreateFor(codeBlock)
				codeBlock.getLines().forEach((line) => {
					// Check the line text for search term matches and collect their ranges
					const markerRanges = getInlineSearchTermMatches(line.text, blockData)
					if (!markerRanges.length) return

					// Flatten marked ranges to prevent any overlaps
					const flattenedRanges = flattenInlineMarkerRanges(markerRanges)

					// Add annotations for all flattened ranges
					flattenedRanges.forEach(({ markerType, start, end }) => {
						line.addAnnotation({
							name: markerType,
							inlineRange: {
								columnStart: start,
								columnEnd: end,
							},
							render: ({ nodesToTransform }) => {
								return nodesToTransform.map((node, idx) => {
									const transformedNode = h(markerType, node)
									if (nodesToTransform.length > 0 && idx > 0) {
										addClass(transformedNode, 'open-start')
									}
									if (nodesToTransform.length > 0 && idx < nodesToTransform.length - 1) {
										addClass(transformedNode, 'open-end')
									}
									return transformedNode
								})
							},
						})
					})
				})
			},
		},
	}
}
