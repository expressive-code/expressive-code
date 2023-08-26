export function binarySearch({
	getValueFn,
	targetValue,
	preferHigher,
	tolerance = 0.1,
	low = 0,
	high = 1,
	minChangeFactor = 0.001,
	maxIterations = 25,
}: {
	getValueFn: (mid: number) => number
	targetValue: number
	/**
	 * Determines the preferred direction in relation to `targetValue`. Will be used in two cases:
	 * - The calculated value is within `tolerance` of `targetValue`.
	 * - The midpoint does not change enough between iterations anymore (see `minChangeFactor`).
	 *
	 * If undefined, the direction will not be taken into account.
	 */
	preferHigher?: boolean | undefined
	tolerance?: number | undefined
	low?: number | undefined
	high?: number | undefined
	/**
	 * If the midpoint changes less than `minChangeFactor * Math.abs(high - low)`
	 * between iterations, the search will stop as soon as the value returned by `getValueFn`
	 * is in the preferred direction in relation to `targetValue`.
	 */
	minChangeFactor?: number | undefined
	maxIterations?: number | undefined
}) {
	const epsilon = minChangeFactor * Math.abs(high - low)
	let iterations = 0
	let mid: number
	let lastMid: number | undefined

	while (((mid = (low + high) / 2), iterations < maxIterations)) {
		const currentValue = getValueFn(mid)

		const resultIsWithinTolerance = Math.abs(currentValue - targetValue) <= tolerance
		const resultIsInPreferredDirection = preferHigher === undefined ? true : preferHigher ? currentValue > targetValue : currentValue < targetValue
		const midChangedLessThanEpsilon = lastMid !== undefined && Math.abs(lastMid - mid) < epsilon

		if (resultIsInPreferredDirection && (resultIsWithinTolerance || midChangedLessThanEpsilon)) {
			return mid
		} else if (currentValue < targetValue) {
			low = mid
		} else {
			high = mid
		}

		iterations++
		lastMid = mid
	}

	return mid
}
