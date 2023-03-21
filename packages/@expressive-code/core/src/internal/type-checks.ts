import { Element, Parent } from 'hast-util-to-html/lib/types'

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
	return node && node.type && typeof node.type === 'string'
}

export function isHastElement(node: Element) {
	return isHastNode(node) && node.type === 'element'
}

export function isHastParent(node: Parent) {
	return isHastNode(node) && (node.type === 'element' || node.type === 'root')
}

export function newTypeError(expectedTypeDescription: string, actualValue: unknown, fieldName?: string) {
	return new Error(`${fieldName ? `Invalid ${fieldName} value: ` : ''}Expected a valid ${expectedTypeDescription}, but got ${JSON.stringify(actualValue)}`)
}
