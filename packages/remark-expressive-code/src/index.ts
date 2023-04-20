import type { Plugin } from 'unified'
import type { Root, Parent, Code, HTML } from 'mdast'
import { visit } from 'unist-util-visit'
import { ExpressiveCode, ExpressiveCodeConfig } from 'expressive-code'
import { toHtml } from 'hast-util-to-html'

export { ExpressiveCodeTheme } from 'expressive-code'

// TODO: Decide on additional options to be exposed by this plugin
export type RemarkExpressiveCodeOptions = ExpressiveCodeConfig /*& {
	someAdditionalOption?: boolean
}*/

const remarkExpressiveCode: Plugin<[RemarkExpressiveCodeOptions?] | [], Root> = (options?: RemarkExpressiveCodeOptions) => {
	const { /*someAdditionalOption,*/ ...ecOptions } = options ?? {}
	const ec = new ExpressiveCode(ecOptions)
	let baseStyles: string | undefined

	return async (tree) => {
		const nodesToProcess: [Parent, Code][] = []

		visit(tree, 'code', (code, index, parent) => {
			if (index === null || parent === null) return
			nodesToProcess.push([parent, code])
		})

		if (nodesToProcess.length === 0) return

		if (baseStyles === undefined) baseStyles = await ec.getBaseStyles()
		let addedBaseStyles = false

		for (const [parent, code] of nodesToProcess) {
			// Try to render the current code node
			const { renderedGroupAst /*, styles*/ } = await ec.render({
				code: code.value,
				language: code.lang || '',
				meta: code.meta || '',
			})
			let htmlContent = toHtml(renderedGroupAst)

			// If the current code node is the first one, add base styles
			if (!addedBaseStyles) {
				addedBaseStyles = true
				htmlContent = `<style>${[...baseStyles].join('')}</style>${htmlContent}`
			}
			// TODO: Add group styles (if any) as a style element

			// Replace current node with a new HTML node
			const html: HTML = {
				type: 'html',
				value: htmlContent,
			}
			parent.children.splice(parent.children.indexOf(code), 1, html)
		}
	}
}

export default remarkExpressiveCode
