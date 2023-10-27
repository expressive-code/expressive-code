import { Element, Properties } from 'hast-util-to-html/lib/types'

/**
 * Retrieves an array of class names from the given AST node.
 */
export function getClassNames(node: Element): string[] {
	const stringOrArr = node.properties?.className
	if (!stringOrArr || stringOrArr === true) return []
	if (Array.isArray(stringOrArr)) return stringOrArr.map((className) => className.toString())
	return stringOrArr.toString().split(' ')
}

/**
 * Adds a property to the given AST node.
 */
export function setProperty(node: Element, propertyName: string, value: string | string[]) {
	const properties: Properties = node.properties || {}
	node.properties = properties
	properties[propertyName] = value
}

/**
 * Adds a class name to the given AST node.
 *
 * If the class name already exists, it will not be added again.
 */
export function addClassName(node: Element, className: string) {
	const classNames = getClassNames(node)
	if (classNames.indexOf(className) === -1) classNames.push(className)
	setProperty(node, 'className', classNames)
}
