export function isNumber(input: number) {
	return typeof input === 'number' && !isNaN(input)
}

export function isString(input: string) {
	return typeof input === 'string'
}

export function isBoolean(input: boolean) {
	return typeof input === 'boolean'
}

export function isFunction(input: () => void) {
	return typeof input === 'function'
}

export function newTypeError(expectedTypeName: string, actualValue: unknown) {
	return new Error(`Expected a valid ${expectedTypeName}, but got ${JSON.stringify(actualValue)}`)
}
