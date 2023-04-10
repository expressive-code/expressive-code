import { ExpressiveCodePlugin, AttachedPluginData, replaceDelimitedValues, addClass, getGroupIndicesFromRegExpMatch, AnnotationRenderFunction } from '@expressive-code/core'
import { h } from 'hastscript'
import rangeParser from 'parse-numeric-range'
import { getTextMarkersBaseStyles } from './styles'

export type MarkerType = 'mark' | 'ins' | 'del'

/** When markers overlap, those with higher indices override lower ones. */
export const MarkerTypeOrder: MarkerType[] = ['mark', 'del', 'ins']

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
					// Highlight all plaintext terms
					blockData.plaintextTerms.forEach(({ markerType, text }) => {
						let idx = line.text.indexOf(text, 0)
						while (idx > -1) {
							line.addAnnotation({
								name: markerType,
								inlineRange: {
									columnStart: idx,
									columnEnd: idx + text.length,
								},
								render: getInlineMarkerRenderFunction(markerType),
							})
							idx = line.text.indexOf(text, idx + text.length)
						}
					})

					// Highlight all regular expression matches
					blockData.regExpTerms.forEach(({ markerType, regExp }) => {
						const matches = line.text.matchAll(regExp)
						for (const match of matches) {
							const rawGroupIndices = getGroupIndicesFromRegExpMatch(match)
							// Remove null group indices
							let groupIndices = rawGroupIndices.flatMap((range) => (range ? [range] : []))
							// If there are no non-null indices, use the full match instead
							// (capture group feature fallback, impossible to cover in tests)
							/* c8 ignore start */
							if (!groupIndices.length) {
								const fullMatchIndex = match.index as number
								groupIndices = [[fullMatchIndex, fullMatchIndex + match[0].length]]
							}
							/* c8 ignore end */
							// If there are multiple non-null indices, remove the first one
							// as it is the full match and we only want to mark capture groups
							if (groupIndices.length > 1) {
								groupIndices.shift()
							}
							// Create marked ranges from all remaining group indices
							groupIndices.forEach((range) => {
								line.addAnnotation({
									name: markerType,
									inlineRange: {
										columnStart: range[0],
										columnEnd: range[1],
									},
									render: getInlineMarkerRenderFunction(markerType),
								})
							})
						}
					})
				})
			},
		},
	}
}

/**
 * If the given input string represents a valid marker type,
 * converts it to a {@link MarkerType} and returns it.
 *
 * Otherwise, returns `undefined`.
 */
export function markerTypeFromString(input: string) {
	// Fix common marker type mistakes
	if (input === 'add') input = 'ins'
	if (input === 'rem') input = 'del'

	// Return either the converted type or undefined
	const markerType = input as MarkerType
	return MarkerTypeOrder.includes(markerType) ? markerType : undefined
}

function getInlineMarkerRenderFunction(markerType: MarkerType): AnnotationRenderFunction {
	return ({ nodesToTransform }) => {
		return nodesToTransform.map((node) => {
			return h(markerType, node)
		})
	}
}
