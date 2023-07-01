import djb2a from 'djb2a'

/**
 * Returns a JSON-like string representation of the given object that is stable,
 * meaning that keys are sorted alphabetically. This causes objects with the same keys and values
 * to always have the same string representation.
 *
 * Circular references are handled by replacing them with the string `[Circular]`.
 *
 * Functions are replaced with the string `[Function]`, unless the `includeFunctionContents`
 * option is set to `true`.
 */
export function stableStringify(obj: unknown, options: { includeFunctionContents?: boolean | undefined } = {}): string {
	const { includeFunctionContents: includeFunctionContents = false } = options
	const visited = new WeakSet()

	const toJson = (value: unknown): unknown => {
		if (typeof value === 'object' && value !== null) {
			if (visited.has(value)) {
				return '[Circular]'
			}

			visited.add(value)

			let result: unknown
			if (Array.isArray(value)) {
				result = value.map(toJson)
			} else {
				const objValue = value as Record<string, unknown>
				const sortedKeys = Object.keys(objValue).sort()
				const sortedObj: Record<string, unknown> = {}
				for (const key of sortedKeys) {
					sortedObj[key] = toJson(objValue[key])
				}
				result = sortedObj
			}

			visited.delete(value)
			return result
		}

		if (typeof value === 'function') {
			return includeFunctionContents ? value.toString() : '[Function]'
		}

		return value
	}

	if (obj === undefined) return 'undefined'

	return JSON.stringify(toJson(obj))
}

/**
 * Returns a simple hash of the given object.
 *
 * The hash is stable, meaning that if the object has the same keys and values (in any order),
 * the hash will be the same. The hash is not cryptographically secure, but uses the simple
 * and fast `djb2a` algorithm, which is known to produce few collisions.
 */
export function getStableObjectHash(obj: unknown, options: { includeFunctionContents?: boolean | undefined; hashLength?: number | undefined } = {}): string {
	const { includeFunctionContents = false, hashLength = 5 } = options
	const numericHash = djb2a(stableStringify(obj, { includeFunctionContents }))
	const padding = '0'.repeat(hashLength)
	return (padding + numericHash.toString(36)).slice(-hashLength)
}
