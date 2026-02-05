import type { Element, ElementContent, Node, Nodes, Parent, Parents, Properties, Root } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { toText } from 'hast-util-to-text'
import { matches, select, selectAll } from 'hast-util-select'
import { visit } from 'unist-util-visit'
import { visitParents, CONTINUE, EXIT, SKIP } from 'unist-util-visit-parents'
import { h, s } from 'hastscript'
import postcss, { Declaration } from 'postcss'
import { serializeCssStringValue } from './internal/escaping'

export { visit, visitParents, CONTINUE, EXIT, SKIP }
export { toHtml, toText, matches, select, selectAll, h, s }

export type { Element, ElementContent, Node, Nodes, Parent, Parents, Properties, Root }

/**
 * Sets a property on the given AST node.
 *
 * You can set the value to `null` to remove the property.
 */
export function setProperty(node: Element, propertyName: string, value: string | string[] | null) {
	const properties: Properties = node.properties || {}
	node.properties = properties
	if (value !== null) {
		properties[propertyName] = value
	} else {
		delete properties[propertyName]
	}
}

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
 * Adds a class name to the given AST node.
 *
 * If the class name already exists on the node, it will not be added again.
 */
export function addClassName(node: Element, className: string) {
	const classNames = getClassNames(node)
	if (classNames.indexOf(className) === -1) classNames.push(className)
	setProperty(node, 'className', classNames)
}

/**
 * Removes a class name from the given AST node.
 *
 * If the class name does not exist on the node, nothing will be changed.
 */
export function removeClassName(node: Element, className: string) {
	const classNames = getClassNames(node)
	const index = classNames.indexOf(className)
	if (index === -1) return
	classNames.splice(index, 1)
	setProperty(node, 'className', classNames)
}

/**
 * If the given node has a `style` attribute, parses it and returns a map of its styles.
 *
 * If the node has no `style` attribute, an empty map is returned.
 */
export function getInlineStyles(node: Element): Map<string, string> {
	const styles = new Map<string, string>()
	const styleString = node.properties?.style?.toString().trim() || ''
	if (!styleString) return styles

	// @ts-expect-error PostCSS has incorrect types when using exactOptionalPropertyTypes
	const postCssOptions: { from?: string } = { from: undefined }

	// Attempt to parse the style string and extract its root-level declarations
	try {
		const root = postcss.parse(styleString, postCssOptions)

		// Extract all root-level declarations into the styles map
		root.each((node) => {
			if (node.type === 'decl') styles.set(node.prop, node.value)
		})
	} catch {
		// Treat invalid inline styles as if they were empty
	}

	return styles
}

/**
 * Sets the `style` attribute on the given node to the given styles.
 *
 * Any existing styles will be overwritten.
 */
export function setInlineStyles(node: Element, styles: Map<string, string>) {
	const styleString = [...styles]
		.map(([prop, value]) =>
			new Declaration({
				prop,
				value,
				raws: {
					between: ':',
				},
			}).toString()
		)
		.join(';')
	setProperty(node, 'style', styleString)
}

/**
 * Sets a single inline style property on the given node.
 *
 * You can set the value to an empty string or `null` to remove the property.
 *
 * Use `valueFormat` to specify how the value should be serialized:
 * - `'raw'`: The value is used as-is. This is the default.
 * - `'string'`: The value is serialized as a CSS string value, escaping special characters.
 */
export function setInlineStyle(node: Element, cssProperty: string, value: string | null, valueFormat: 'raw' | 'string' = 'raw') {
	const styles = getInlineStyles(node)
	if (value !== null) {
		styles.set(cssProperty, valueFormat === 'string' ? serializeCssStringValue(value) : value)
	} else {
		styles.delete(cssProperty)
	}
	setInlineStyles(node, styles)
}
