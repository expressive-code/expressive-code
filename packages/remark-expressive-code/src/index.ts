import type { Plugin, Transformer, VFileWithOutput } from 'unified'
import type { Root } from 'mdast'
import { BundledShikiTheme, ExpressiveCodeConfig, ExpressiveCodeTheme, ExpressiveCodeBlockOptions, ExpressiveCodeBlock } from 'expressive-code'
import { RemarkExpressiveCodeDocument, collectCodeNodes, groupCodeNodes, replaceNodesWithRenderedHtml } from './document'
import { RemarkExpressiveCodeRenderer, createRenderer, createRenderers, prepareGroupRenderInput, renderGroupToHtml } from './rendering'

export * from 'expressive-code'

export type RemarkExpressiveCodeOptions = Omit<ExpressiveCodeConfig, 'theme'> & {
	/**
	 * The color theme(s) that should be used when rendering. You can either reference any
	 * theme bundled with Shiki by name or load an ExpressiveCodeTheme and pass it here.
	 *
	 * If you want to load a custom JSON theme file yourself, you can load its contents
	 * into a string and pass it to `ExpressiveCodeTheme.fromJSONString()`.
	 *
	 * Defaults to the `github-dark` theme bundled with Shiki.
	 *
	 * **Note**: You can pass an array of themes to this option to render each code block
	 * in your markdown/MDX documents using multiple themes. In this case, you will also need
	 * to add custom CSS code to your site to ensure that only one theme is visible at any time.
	 *
	 * To allow targeting all code blocks of a given theme through CSS, the theme property `name`
	 * is used to generate kebap-cased class names in the format `ec-theme-${name}`.
	 * For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice,
	 * once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.
	 */
	theme?: BundledShikiTheme | ExpressiveCodeTheme | (BundledShikiTheme | ExpressiveCodeTheme)[] | undefined
	/**
	 * The number of spaces that should be used to render tabs. Defaults to 2.
	 *
	 * Any tabs found in code blocks in your markdown/MDX documents will be replaced
	 * with the specified number of spaces. This ensures that the code blocks are
	 * rendered consistently across browsers and platforms.
	 *
	 * If you want to preserve tabs in your code blocks, set this option to 0.
	 */
	tabWidth?: number | undefined
	/**
	 * This optional function provides support for multi-language sites by allowing you
	 * to customize the locale used for a given code block.
	 *
	 * If the function returns `undefined`, the default locale provided in the
	 * Expressive Code configuration is used.
	 */
	getBlockLocale?: (({ input, file }: { input: ExpressiveCodeBlockOptions; file: VFileWithOutput<null> }) => string | undefined | Promise<string | undefined>) | undefined
	/**
	 * This optional function allows you to customize how `ExpressiveCodeBlock`
	 * instances are created from code blocks found in the Markdown document.
	 *
	 * The function is called with an object containing the following properties:
	 * - `input`: Block data for the `ExpressiveCodeBlock` constructor.
	 * - `file`: A `VFile` instance representing the Markdown document.
	 *
	 * The function is expected to return an `ExpressiveCodeBlock` instance
	 * or a promise resolving to one.
	 */
	customCreateBlock?: (({ input, file }: { input: ExpressiveCodeBlockOptions; file: VFileWithOutput<null> }) => ExpressiveCodeBlock | Promise<ExpressiveCodeBlock>) | undefined
	/**
	 * This advanced option allows you to influence the rendering process by creating
	 * your own `ExpressiveCode` instance or processing the base styles and JS modules
	 * added to every page.
	 *
	 * If an array of themes was passed to the `theme` option, this function will be called
	 * once per theme, with all other options being the same.
	 *
	 * The return value will be cached per theme and used for all code blocks in the document.
	 */
	customCreateRenderer?: ((options: SingleThemeRemarkExpressiveCodeOptions) => Promise<RemarkExpressiveCodeRenderer> | RemarkExpressiveCodeRenderer) | undefined
	/**
	 * This advanced option allows you to influence the rendering process by creating
	 * your own array of `ExpressiveCode` instances from the given `options` or processing
	 * the base styles and JS modules added to every page.
	 *
	 * If you implement your version of this function, please ensure that you create
	 * an `ExpressiveCode` instance for each theme passed to the `theme` option.
	 *
	 * This function will be called once when the first code block is encountered,
	 * and the returned renderers will be cached for the lifetime of the remark plugin.
	 */
	customCreateRenderers?: ((options: RemarkExpressiveCodeOptions) => Promise<RemarkExpressiveCodeRenderer[]> | RemarkExpressiveCodeRenderer[]) | undefined
}

export type SingleThemeRemarkExpressiveCodeOptions = Omit<RemarkExpressiveCodeOptions, 'theme'> & {
	theme?: BundledShikiTheme | ExpressiveCodeTheme | undefined
}

export type { RemarkExpressiveCodeDocument, RemarkExpressiveCodeRenderer }
export { createRenderer, createRenderers }

const remarkExpressiveCode: Plugin<[RemarkExpressiveCodeOptions] | unknown[], Root> = (...settings) => {
	const options: RemarkExpressiveCodeOptions = settings[0] ?? {}
	const { tabWidth = 2, getBlockLocale, customCreateRenderers, customCreateBlock } = options

	let asyncRenderers: Promise<RemarkExpressiveCodeRenderer[]> | RemarkExpressiveCodeRenderer[] | undefined

	const transformer: Transformer<Root, Root> = async (tree, file) => {
		// Collect all code nodes in the document,
		// and ensure that we found at least one
		const ungroupedCodeNodes = collectCodeNodes(tree)
		if (!ungroupedCodeNodes.length) return

		// Group nodes that should be rendered together based on
		// code fence meta tags and adjacency in the document
		const nodeGroups = groupCodeNodes(ungroupedCodeNodes)

		// Ensure that our renderers are available and ready to use
		if (asyncRenderers === undefined) {
			asyncRenderers = (customCreateRenderers ?? createRenderers)(options)
		}
		const renderers = await asyncRenderers

		const parentDocument: ExpressiveCodeBlockOptions['parentDocument'] = {
			sourceFilePath: file.path,
		}
		const addedStyles = new Set<string>()
		const addedJsModules = new Set<string>()

		// Now go through all groups of code nodes and render them
		for (const nodeGroup of nodeGroups) {
			if (!nodeGroup.length) continue

			// Transform the node group into an array of ExpressiveCodeBlockOptions
			// that can be used as common input for all renderers
			const groupRenderInput = await prepareGroupRenderInput({
				nodeGroup,
				parentDocument,
				tabWidth,
				getBlockLocale,
				file,
			})

			// Render the group using all renderers
			const renderedBlocks: string[] = []
			for (const renderer of renderers) {
				renderedBlocks.push(
					await renderGroupToHtml({
						groupRenderInput,
						renderer,
						customCreateBlock,
						file,
						// Keep track of added styles and JS modules
						// across all rendered blocks to avoid duplicates
						addedStyles,
						addedJsModules,
					})
				)
			}

			// Finally, replace the document nodes with the rendered HTML
			const html = renderedBlocks.join('')
			replaceNodesWithRenderedHtml(nodeGroup, html)
		}
	}

	return transformer
}

export default remarkExpressiveCode
