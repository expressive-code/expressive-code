import { Element, Parent, Properties } from 'hast-util-to-html/lib/types'

export function addClass(node: Parent, className: string) {
	const element = node as Element
	const properties: Properties = element.properties || {}
	element.properties = properties
	const classNames = properties.className?.toString().split(' ') || []
	if (classNames.indexOf(className) === -1) classNames.push(className)
	properties.className = classNames.join(' ')
}
