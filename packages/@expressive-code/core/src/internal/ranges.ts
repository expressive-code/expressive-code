/**
 * Converts a relative range defined by the inputs `start` and `end`
 * to an absolute range between `0` and `rangeMax`.
 *
 * The behavior matches the logic of `Array.prototype.slice()` and `String.prototype.slice()`,
 * which accept negative numbers as relative positions counted backwards from `rangeMax`,
 * and `undefined` to indicate either the start or end of the absolute range.
 */
export function getAbsoluteRange({
	start,
	end,
	rangeMax,
}: {
	/**
	 * The given start of the range.
	 *
	 * - Positive numbers will remain unchanged, but will be capped at `rangeMax`.
	 * - Negative numbers will be counted backwards from `rangeMax`,
	 *   but the absolute location will be capped at a minimum of 0 (the start of the range).
	 * - A value of `undefined` will be treated like `0` (the start of the range).
	 */
	start: number | undefined
	/**
	 * The given end of the range.
	 *
	 * - Positive numbers will remain unchanged, but will be capped at `rangeMax`.
	 * - Negative numbers will be counted backwards from `rangeMax`,
	 *   but the absolute location will be capped at a minimum of 0 (the start of the range).
	 * - A value of `undefined` will be treated like `rangeMax` (the end of the range).
	 */
	end: number | undefined
	/**
	 * The available maximum of the range. The given inputs will be capped
	 * to ensure that this maximum cannot be exceeded.
	 */
	rangeMax: number
}) {
	start = Math.min(start ?? 0, rangeMax)
	end = Math.min(end ?? rangeMax, rangeMax)
	if (start < 0) start = Math.max(start + rangeMax, 0)
	if (end < 0) end = Math.max(end + rangeMax, 0)

	return [start, end]
}
