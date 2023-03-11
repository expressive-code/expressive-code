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

export function isHastElement(node: Element) {
	return node && node.type && typeof node.type === 'string' && node.type === 'element'
}

export function isHastParent(node: Parent) {
	return node && node.type && typeof node.type === 'string' && (node.type === 'element' || node.type === 'root')
}

export function newTypeError(expectedTypeName: string, actualValue: unknown) {
	return new Error(`Expected a valid ${expectedTypeName}, but got ${JSON.stringify(actualValue)}`)
}
