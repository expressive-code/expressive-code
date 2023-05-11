import type { Plugin, Transformer } from 'unified'
import type { Root, Parent, Code, HTML } from 'mdast'
import { visit } from 'unist-util-visit'
import { BundledShikiTheme, loadShikiTheme, ExpressiveCode, ExpressiveCodeConfig, ExpressiveCodeTheme } from 'expressive-code'
import { toHtml } from 'hast-util-to-html'

export { ExpressiveCodeTheme } from 'expressive-code'

export type RemarkExpressiveCodeOptions = Omit<ExpressiveCodeConfig, 'theme'> & {
	/**
	 * The color theme that should be used when rendering. You can either reference any
	 * theme bundled with Shiki by name or load an ExpressiveCodeTheme and pass it here.
	 *
	 * If you want to load a custom JSON theme file yourself, you can load its contents
	 * into a string and pass it to `ExpressiveCodeTheme.fromJSONString()`.
	 *
	 * Defaults to the `github-dark` theme bundled with Shiki.
	 */
	theme?: BundledShikiTheme | ExpressiveCodeTheme
}

const remarkExpressiveCode: Plugin<[RemarkExpressiveCodeOptions] | unknown[], Root> = (...settings) => {
	const options: RemarkExpressiveCodeOptions = settings[0] ?? {}
	const { theme, ...ecOptions } = options

	const getLazyLoadPromise = async () => {
		const mustLoadTheme = theme !== undefined && !(theme instanceof ExpressiveCodeTheme)
		const optLoadedTheme = mustLoadTheme ? new ExpressiveCodeTheme(await loadShikiTheme(theme)) : theme
		const ec = new ExpressiveCode({ theme: optLoadedTheme, ...ecOptions })
		const baseStyles = await ec.getBaseStyles()

		return {
			ec,
			baseStyles,
		}
	}
	let lazyLoadPromise: ReturnType<typeof getLazyLoadPromise> | undefined

	const transformer: Transformer<Root, Root> = async (tree) => {
		const nodesToProcess: [Parent, Code][] = []

		visit(tree, 'code', (code, index, parent) => {
			if (index === null || parent === null) return
			nodesToProcess.push([parent, code])
		})

		if (nodesToProcess.length === 0) return

		// We found at least one code node, so we need to ensure our lazy-loaded
		// resources are available before we can continue
		if (lazyLoadPromise === undefined) {
			lazyLoadPromise = getLazyLoadPromise()
		}
		const { ec, baseStyles } = await lazyLoadPromise
		let addedBaseStyles = false
		const addedGroupStyles = new Set<string>()

		for (const [parent, code] of nodesToProcess) {
			// Try to render the current code node
			const { renderedGroupAst, styles } = await ec.render({
				code: code.value,
				language: code.lang || '',
				meta: code.meta || '',
			})
			let htmlContent = toHtml(renderedGroupAst)

			// Collect styles that we need to prepend to the rendered HTML content
			const stylesToPrepend: string[] = []
			if (!addedBaseStyles) {
				// We didn't add the base styles yet, so we need to do that first
				addedBaseStyles = true
				stylesToPrepend.push(baseStyles)
			}
			// Add all group-level styles that we haven't added yet
			for (const style of styles) {
				if (!addedGroupStyles.has(style)) {
					addedGroupStyles.add(style)
					stylesToPrepend.push(style)
				}
			}
			// If we collected any styles, add them before the HTML content
			if (stylesToPrepend.length) {
				htmlContent = `<style>${[...stylesToPrepend].join('')}</style>${htmlContent}`
			}

			// Replace current node with a new HTML node
			const html: HTML = {
				type: 'html',
				value: htmlContent,
			}
			parent.children.splice(parent.children.indexOf(code), 1, html)
		}
	}

	return transformer
}

export default remarkExpressiveCode
