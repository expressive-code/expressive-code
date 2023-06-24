import type { Plugin, Transformer } from 'unified'
import type { Root, Parent, Code, HTML } from 'mdast'
import { visit } from 'unist-util-visit'
import { BundledShikiTheme, loadShikiTheme, ExpressiveCode, ExpressiveCodeConfig, ExpressiveCodeTheme } from 'expressive-code'
import { toHtml } from 'hast-util-to-html'

export * from 'expressive-code'

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
	/**
	 * This advanced option allows you to influence the rendering process by providing
	 * your own `ExpressiveCode` instance or processing the base styles and JS modules
	 * added to every page.
	 */
	customRenderer?: RemarkExpressiveCodeRenderer
}

export type RemarkExpressiveCodeRenderer = {
	ec: ExpressiveCode
	baseStyles: string
	jsModules: string[]
}

/**
 * Uses the given options to create an `ExpressiveCode` instance, including support to load
 * themes bundled with Shiki by name.
 *
 * Returns the `ExpressiveCode` instance together with the base styles and JS modules
 * that should be added to every page.
 *
 * Unless you use the `customRenderer` option, the remark plugin automatically calls this function
 * once when encountering the first code block, and caches the result.
 */
export async function createRenderer(options: RemarkExpressiveCodeOptions): Promise<RemarkExpressiveCodeRenderer> {
	const { theme, ...ecOptions } = options

	const mustLoadTheme = theme !== undefined && !(theme instanceof ExpressiveCodeTheme)
	const optLoadedTheme = mustLoadTheme ? new ExpressiveCodeTheme(await loadShikiTheme(theme)) : theme
	const ec = new ExpressiveCode({ theme: optLoadedTheme, ...ecOptions })
	const baseStyles = await ec.getBaseStyles()
	const jsModules = await ec.getJsModules()

	return {
		ec,
		baseStyles,
		jsModules,
	}
}

const remarkExpressiveCode: Plugin<[RemarkExpressiveCodeOptions] | unknown[], Root> = (...settings) => {
	const options: RemarkExpressiveCodeOptions = settings[0] ?? {}
	const { customRenderer } = options

	let cachedRenderer: Promise<RemarkExpressiveCodeRenderer> | RemarkExpressiveCodeRenderer | undefined

	const transformer: Transformer<Root, Root> = async (tree) => {
		const nodesToProcess: [Parent, Code][] = []

		visit(tree, 'code', (code, index, parent) => {
			if (index === null || parent === null) return
			nodesToProcess.push([parent, code])
		})

		if (nodesToProcess.length === 0) return

		// We found at least one code node, so we need to ensure our renderer is available
		// and wait for its initialization if necessary
		if (cachedRenderer === undefined) {
			cachedRenderer = customRenderer ?? createRenderer(options)
		}
		const { ec, baseStyles, jsModules } = await cachedRenderer
		let isFirstBlock = true
		const addedGroupStyles = new Set<string>()

		for (const [parent, code] of nodesToProcess) {
			// Try to render the current code node
			const { renderedGroupAst, styles } = await ec.render({
				code: code.value,
				language: code.lang || '',
				meta: code.meta || '',
			})

			// Collect any style and script elements that we need to add to the output
			type HastElement = Extract<(typeof renderedGroupAst.children)[number], { type: 'element' }>
			const extraElements: HastElement[] = []
			const stylesToPrepend: string[] = []

			// Add base styles when we are processing the first code block in the document
			if (isFirstBlock && baseStyles) stylesToPrepend.push(baseStyles)
			// Add all group-level styles that we haven't added yet
			for (const style of styles) {
				if (!addedGroupStyles.has(style)) {
					addedGroupStyles.add(style)
					stylesToPrepend.push(style)
				}
			}
			// Combine all styles we collected (if any) into a single style element
			if (stylesToPrepend.length) {
				extraElements.push({
					type: 'element',
					tagName: 'style',
					children: [{ type: 'text', value: [...stylesToPrepend].join('') }],
				})
			}

			// Create script elements for all JS modules on the first code block in the document
			if (isFirstBlock && jsModules.length) {
				jsModules.forEach((moduleCode) =>
					extraElements.push({
						type: 'element',
						tagName: 'script',
						properties: { type: 'module' },
						children: [{ type: 'text', value: moduleCode }],
					})
				)
			}

			// Prepend any extra elements to the children of the renderedGroupAst wrapper,
			// which keeps them inside the wrapper and reduces the chance of CSS issues
			// caused by selectors like `* + *` on the parent level
			renderedGroupAst.children.unshift(...extraElements)

			// Render the group AST to HTML
			const htmlContent = toHtml(renderedGroupAst)

			// Replace current node with a new HTML node
			const html: HTML = {
				type: 'html',
				value: htmlContent,
			}
			parent.children.splice(parent.children.indexOf(code), 1, html)
			isFirstBlock = false
		}
	}

	return transformer
}

export default remarkExpressiveCode
