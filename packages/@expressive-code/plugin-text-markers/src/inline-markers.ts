import { getGroupIndicesFromRegExpMatch } from '@expressive-code/core'
import { MarkerType, MarkerTypeOrder } from './marker-types'
import { PluginTextMarkersData } from '.'

export type InlineMarkerRange = { markerType: MarkerType; start: number; end: number }

/**
 * Goes through all search terms in the given block data and returns an array of
 * inline marker ranges that match the given line text.
 */
export function getInlineSearchTermMatches(lineText: string, blockData: PluginTextMarkersData) {
	const markerMatches: InlineMarkerRange[] = []

	// Collect all plaintext term matches
	blockData.plaintextTerms.forEach(({ markerType, text }) => {
		let idx = lineText.indexOf(text, 0)
		while (idx > -1) {
			markerMatches.push({
				markerType,
				start: idx,
				end: idx + text.length,
			})
			idx = lineText.indexOf(text, idx + text.length)
		}
	})

	// Collect all regular expression matches
	blockData.regExpTerms.forEach(({ markerType, regExp }) => {
		const matches = lineText.matchAll(regExp)
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
				markerMatches.push({
					markerType,
					start: range[0],
					end: range[1],
				})
			})
		}
	})

	return markerMatches
}

/**
 * Takes an array of inline marker ranges and returns a new array without overlapping ranges,
 * either by merging them into a combined range (if their marker types are the same),
 * or by overriding lower-priority markers with higher-priority ones (if their types differ).
 */
export function flattenInlineMarkerRanges(markerRanges: InlineMarkerRange[]): InlineMarkerRange[] {
	const flattenedRanges: InlineMarkerRange[] = []
	const sortedRanges = [...markerRanges].sort((a, b) => a.start - b.start)
	const posInRange = (pos: number): { idx: number; range?: InlineMarkerRange } => {
		for (let idx = 0; idx < flattenedRanges.length; idx++) {
			const range = flattenedRanges[idx]
			if (pos < range.end)
				return {
					idx,
					range: pos >= range.start ? range : undefined,
				}
		}
		// After the last element
		return {
			idx: flattenedRanges.length,
		}
	}

	MarkerTypeOrder.forEach((markerType) => {
		sortedRanges
			.filter((range) => range.markerType === markerType)
			.forEach((rangeToAdd) => {
				// Clone range to avoid overriding values of the original object
				rangeToAdd = { ...rangeToAdd }

				// Get insertion position for the start and end of rangeToAdd
				const posStart = posInRange(rangeToAdd.start)
				const posEnd = posInRange(rangeToAdd.end)

				const newElements: InlineMarkerRange[] = [rangeToAdd]

				// rangeToAdd starts inside an existing range and their start points differ
				if (posStart.range && rangeToAdd.start !== posStart.range.start) {
					if (posStart.range.markerType === rangeToAdd.markerType) {
						rangeToAdd.start = posStart.range.start
					} else {
						newElements.unshift({
							...posStart.range,
							end: rangeToAdd.start,
						})
					}
				}

				// rangeToAdd ends inside an existing range and their end points differ
				if (posEnd.range && rangeToAdd.end !== posEnd.range.end) {
					if (posEnd.range.markerType === rangeToAdd.markerType) {
						rangeToAdd.end = posEnd.range.end
					} else {
						newElements.push({
							...posEnd.range,
							start: rangeToAdd.end,
						})
					}
				}

				flattenedRanges.splice(posStart.idx, posEnd.idx - posStart.idx + 1, ...newElements)
			})
	})

	return flattenedRanges
}
