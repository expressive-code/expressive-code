import type { Element, Node } from '../hast'

export function isNumber(input: unknown): input is number {
	return typeof input === 'number' && !isNaN(input)
}

export function isString(input: unknown): input is string {
	return typeof input === 'string'
}

export function isBoolean(input: unknown): input is boolean {
	return typeof input === 'boolean'
}

export function isFunction<Type>(input: unknown): input is Type {
	return typeof input === 'function'
}

function isHastNode(node: unknown): node is Node {
	return !!node && typeof node === 'object' && typeof (node as { type?: unknown }).type === 'string'
}

export function isHastElement(node: unknown): node is Element {
	return isHastNode(node) && node.type === 'element'
}

export function newTypeError(expectedTypeDescription: string, actualValue: unknown, fieldName?: string) {
	return new Error(`${fieldName ? `Invalid ${fieldName} value: ` : ''}Expected a valid ${expectedTypeDescription}, but got ${JSON.stringify(actualValue)}`)
}
