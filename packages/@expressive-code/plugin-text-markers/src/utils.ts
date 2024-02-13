import { MarkerDefinition } from '.'

/**
 * Retrieves all group indices from the given RegExp match. Group indices are ranges
 * defined by start & end positions. The first group index refers to the full match,
 * and the following indices to RegExp capture groups (if any).
 *
 * If the RegExp flag `d` was enabled (and supported), it returns the native group indices.
 *
 * Otherwise, it uses fallback logic to manually search for the group contents inside the
 * full match. Note that this can be wrong if a group's contents can be found multiple times
 * inside the full match, but that's probably a rare case and still better than failing.
 */
export function getGroupIndicesFromRegExpMatch(match: RegExpMatchArray) {
	// Read the start and end ranges from the `indices` property,
	// which is made available through the RegExp flag `d`
	let groupIndices = match.indices as ([start: number, end: number] | null)[]
	if (groupIndices?.length) return groupIndices

	// We could not access native group indices, so we need to use fallback logic
	// to find the position of each capture group match inside the full match
	const fullMatchIndex = match.index as number
	groupIndices = match.map((groupValue) => {
		const groupIndex = groupValue ? match[0].indexOf(groupValue) : -1
		if (groupIndex === -1) return null
		const groupStart = fullMatchIndex + groupIndex
		const groupEnd = groupStart + groupValue.length
		return [groupStart, groupEnd]
	})

	return groupIndices
}

export function toDefinitionsArray(value: MarkerDefinition | MarkerDefinition[] | undefined) {
	if (value === undefined) return []
	return Array.isArray(value) ? value : [value]
}
