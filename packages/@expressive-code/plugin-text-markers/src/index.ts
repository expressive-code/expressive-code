import { ExpressiveCodePlugin, AttachedPluginData, replaceDelimitedValues, addClass } from '@expressive-code/core'
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
