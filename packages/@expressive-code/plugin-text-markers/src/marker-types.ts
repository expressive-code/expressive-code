export type MarkerType = 'mark' | 'ins' | 'del'

/** When markers overlap, those with higher indices override lower ones. */
export const MarkerTypeOrder: MarkerType[] = ['mark', 'del', 'ins']

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
