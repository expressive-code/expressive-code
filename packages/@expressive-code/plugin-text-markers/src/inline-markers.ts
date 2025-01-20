import { ExpressiveCodeBlock } from '@expressive-code/core'
import { MarkerType, MarkerTypeOrder } from './marker-types'
import { getGroupIndicesFromRegExpMatch, toDefinitionsArray } from './utils'

export type InlineMarkerRange = { markerType: MarkerType; start: number; end: number }

/**
 * Goes through all search terms in the given block data and returns an array of
 * inline marker ranges that match the given line text.
 */
export function getInlineSearchTermMatches(lineText: string, codeBlock: ExpressiveCodeBlock) {
	const markerMatches: InlineMarkerRange[] = []

	MarkerTypeOrder.forEach((markerType) => {
		toDefinitionsArray(codeBlock.props[markerType]).forEach((definition) => {
			// Handle plaintext string definitions
			if (typeof definition === 'string') {
				let idx = lineText.indexOf(definition, 0)
				while (idx > -1) {
					markerMatches.push({
						markerType,
						start: idx,
						end: idx + definition.length,
					})
					idx = lineText.indexOf(definition, idx + definition.length)
				}
			}
			// Handle regular expression definitions
			if (definition instanceof RegExp) {
				const matches = lineText.matchAll(definition)
				for (const match of matches) {
					const rawGroupIndices = getGroupIndicesFromRegExpMatch(match)
					// Remove null group indices
					let groupIndices = rawGroupIndices.flatMap((range) => (range ? [range] : []))
					// If there are no non-null indices, use the full match instead
					// (capture group feature fallback, impossible to cover in tests)
					/* c8 ignore start */
					if (!groupIndices.length) {
						groupIndices = [[match.index, match.index + match[0].length]]
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
			}
		})
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
	const addRange = (newRange: InlineMarkerRange) => {
		for (let idx = flattenedRanges.length - 1; idx >= 0; idx--) {
			const curRange = flattenedRanges[idx]
			// No overlap: The new range ends before the current one starts,
			// or it starts after the current one ends
			if (newRange.end <= curRange.start || newRange.start >= curRange.end) continue

			// Full overlap: The new range fully covers the current one
			if (newRange.start <= curRange.start && newRange.end >= curRange.end) {
				// Remove current range
				flattenedRanges.splice(idx, 1)
				continue
			}

			// Partial overlap with same marker type
			if (newRange.markerType === curRange.markerType) {
				// Remove current range and extend the new one to cover it
				flattenedRanges.splice(idx, 1)
				newRange = {
					...newRange,
					start: Math.min(newRange.start, curRange.start),
					end: Math.max(newRange.end, curRange.end),
				}
				continue
			}

			// If the new range leaves both the start and the end of the current range
			// uncovered, we need to split the current range into two parts
			if (newRange.start > curRange.start && newRange.end < curRange.end) {
				// Replace the current range with two partial ranges
				flattenedRanges.splice(idx, 1, { ...curRange, end: newRange.start }, { ...curRange, start: newRange.end })
				continue
			}

			// If the new range starts after the current one starts, shorten the current range
			if (newRange.start > curRange.start) {
				curRange.end = newRange.start
			}

			// If the new range ends before the current one ends, shorten the current range
			if (newRange.end < curRange.end) {
				curRange.start = newRange.end
			}
		}
		// Finally add the new range to the flattened ranges and sort them by start position
		flattenedRanges.push(newRange)
		flattenedRanges.sort((a, b) => a.start - b.start)
	}

	MarkerTypeOrder.forEach((markerType) => {
		markerRanges.filter((range) => range.markerType === markerType).forEach(addRange)
	})

	return flattenedRanges
}
