import { selectAll } from '@expressive-code/core/hast'
export { fromHtml } from 'hast-util-from-html'

/**
 * Matches the given CSS selector against the given HAST tree,
 * expecting exactly one matching element.
 *
 * Returns the single matching element or throws an error otherwise.
 */
export function selectSingle(selector: string, tree?: Parameters<typeof selectAll>[1], space?: Parameters<typeof selectAll>[2]) {
	const nodes = selectAll(selector, tree, space)
	if (nodes.length !== 1) throw new Error(`Expected selector "${selector}" to match a single element, but got ${nodes.length} matches`)
	return nodes[0]
}
