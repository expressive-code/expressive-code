import { Node } from '../hast'

export function isNumber(input: number) {
	return typeof input === 'number' && !isNaN(input)
}

export function isString(input: string) {
	return typeof input === 'string'
}

export function isBoolean(input: boolean) {
	return typeof input === 'boolean'
}

export function isFunction<Type>(input: Type) {
	return typeof input === 'function'
}

function isHastNode(node: { type: string }) {
	return node?.type ? typeof node.type === 'string' : false
}

export function isHastElement(node: Node) {
	return isHastNode(node) && node.type === 'element'
}

export function isValidCodeBlockType(type: string) {
	return type === 'inline' || type === 'block'
}

export function newTypeError(expectedTypeDescription: string, actualValue: unknown, fieldName?: string) {
	return new Error(`${fieldName ? `Invalid ${fieldName} value: ` : ''}Expected a valid ${expectedTypeDescription}, but got ${JSON.stringify(actualValue)}`)
}
