import type { Plugin, Transformer, VFileWithOutput } from 'unified'
import type { Root, Parent, Code, HTML } from 'mdast'
import { visit } from 'unist-util-visit'
import { BundledShikiTheme, loadShikiTheme, ExpressiveCode, ExpressiveCodeConfig, ExpressiveCodeTheme, ExpressiveCodeBlockOptions, ExpressiveCodeBlock } from 'expressive-code'
import { toHtml } from 'hast-util-to-html'

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

export type RemarkExpressiveCodeDocument = {
	/**
	 * The full path to the source file containing the code block.
	 */
	sourceFilePath?: string | undefined
}

export type RemarkExpressiveCodeRenderer = {
	ec: ExpressiveCode
	baseStyles: string
	jsModules: string[]
}

/**
 * Creates all required `ExpressiveCode` instances to render code blocks using the given `options`.
 *
 * If multiple themes were passed to the `theme` option, a separate `ExpressiveCode` instance
 * will be created for each theme.
 *
 * Renderers are created by either calling the `customCreateRenderer` function (if provided),
 * or the exported `createRenderer` function.
 *
 * The remark plugin automatically calls this function once when encountering the first code block,
 * and caches the result.
 */
export async function createRenderers(options: RemarkExpressiveCodeOptions): Promise<RemarkExpressiveCodeRenderer[]> {
	const renderers: RemarkExpressiveCodeRenderer[] = []

	const themes = Array.isArray(options.theme) ? options.theme : [options.theme]
	for (const theme of themes) {
		const renderer = await (options.customCreateRenderer ?? createRenderer)({ ...options, theme })
		renderers.push(renderer)
	}

	return renderers
}

/**
 * Creates a single `ExpressiveCode` instance using the given `options`,
 * including support to load a theme bundled with Shiki by name.
 *
 * Note that this function only supports a single theme. If multiple themes were passed
 * to the `theme` option, you must call this function once for each theme. To avoid implementing
 * this logic yourself, you can use the `createRenderers()` function instead.
 *
 * Returns the created `ExpressiveCode` instance together with the base styles and JS modules
 * that should be added to every page.
 */
export async function createRenderer(options: SingleThemeRemarkExpressiveCodeOptions = {}): Promise<RemarkExpressiveCodeRenderer> {
	const { theme, ...ecOptions } = options

	const mustLoadTheme = theme !== undefined && !(theme instanceof ExpressiveCodeTheme)
	const optLoadedTheme = mustLoadTheme ? new ExpressiveCodeTheme(await loadShikiTheme(theme)) : theme
	const ec = new ExpressiveCode({
		theme: optLoadedTheme,
		...ecOptions,
	})
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
	const { tabWidth = 2, getBlockLocale, customCreateRenderers, customCreateBlock } = options

	let asyncRenderers: Promise<RemarkExpressiveCodeRenderer[]> | RemarkExpressiveCodeRenderer[] | undefined

	const renderBlockToHtml = async ({
		codeBlock,
		renderer,
		addedStyles,
		addedJsModules,
	}: {
		codeBlock: ExpressiveCodeBlock
		renderer: RemarkExpressiveCodeRenderer
		addedStyles: Set<string>
		addedJsModules: Set<string>
	}): Promise<string> => {
		const { ec, baseStyles, jsModules } = renderer

		// Try to render the current code block
		const { renderedGroupAst, styles } = await ec.render(codeBlock)

		// Collect any style and script elements that we need to add to the output
		type HastElement = Extract<(typeof renderedGroupAst.children)[number], { type: 'element' }>
		const extraElements: HastElement[] = []
		const stylesToPrepend: string[] = []

		// Add base styles if we haven't added them yet
		if (baseStyles && !addedStyles.has(baseStyles)) {
			addedStyles.add(baseStyles)
			stylesToPrepend.push(baseStyles)
		}
		// Add any group-level styles we haven't added yet
		for (const style of styles) {
			if (addedStyles.has(style)) continue
			addedStyles.add(style)
			stylesToPrepend.push(style)
		}
		// Combine all styles we collected (if any) into a single style element
		if (stylesToPrepend.length) {
			extraElements.push({
				type: 'element',
				tagName: 'style',
				children: [{ type: 'text', value: [...stylesToPrepend].join('') }],
			})
		}

		// Create script elements for all JS modules we haven't added yet
		jsModules.forEach((moduleCode) => {
			if (addedJsModules.has(moduleCode)) return
			addedJsModules.add(moduleCode)
			extraElements.push({
				type: 'element',
				tagName: 'script',
				properties: { type: 'module' },
				children: [{ type: 'text', value: moduleCode }],
			})
		})

		// Prepend any extra elements to the children of the renderedGroupAst wrapper,
		// which keeps them inside the wrapper and reduces the chance of CSS issues
		// caused by selectors like `* + *` on the parent level
		renderedGroupAst.children.unshift(...extraElements)

		// Render the group AST to HTML
		const htmlContent = toHtml(renderedGroupAst)

		return htmlContent
	}

	const transformer: Transformer<Root, Root> = async (tree, file) => {
		const nodesToProcess: [Parent, Code][] = []

		visit(tree, 'code', (code, index, parent) => {
			if (index === null || parent === null) return
			nodesToProcess.push([parent, code])
		})

		if (nodesToProcess.length === 0) return

		// We found at least one code node, so we need to ensure our renderers are available
		// and wait for their initialization if necessary
		if (asyncRenderers === undefined) {
			asyncRenderers = (customCreateRenderers ?? createRenderers)(options)
		}
		const renderers = await asyncRenderers

		const parentDocument: ExpressiveCodeBlockOptions['parentDocument'] = {
			sourceFilePath: file.path,
		}
		const addedStyles = new Set<string>()
		const addedJsModules = new Set<string>()

		for (const [parent, code] of nodesToProcess) {
			// Normalize the code coming from the Markdown/MDX document
			let normalizedCode = code.value
			if (tabWidth > 0) normalizedCode = normalizedCode.replace(/\t/g, ' '.repeat(tabWidth))

			// Build the ExpressiveCodeBlockOptions object that we will pass either
			// to the ExpressiveCodeBlock constructor or the customCreateBlock function
			const baseInput: ExpressiveCodeBlockOptions = {
				code: normalizedCode,
				language: code.lang || '',
				meta: code.meta || '',
				parentDocument,
			}

			// Allow the user to customize the locale for this code block
			if (getBlockLocale) {
				baseInput.locale = await getBlockLocale({ input: baseInput, file })
			}

			// Render the input using all renderers
			const renderedBlocks: string[] = []
			for (const renderer of renderers) {
				// Clone the input to prevent any modifications during instance creation
				// from affecting other renderers
				const input = { ...baseInput }

				// Allow the user to customize the ExpressiveCodeBlock instance
				const codeBlock = customCreateBlock ? await customCreateBlock({ input, file }) : new ExpressiveCodeBlock(input)

				// Render the code block to HTML
				renderedBlocks.push(await renderBlockToHtml({ codeBlock, renderer, addedStyles, addedJsModules }))
			}

			// Replace current node with a new HTML node that contains all rendered blocks
			const html: HTML = {
				type: 'html',
				value: renderedBlocks.join(''),
			}
			parent.children.splice(parent.children.indexOf(code), 1, html)
		}
	}

	return transformer
}

export default remarkExpressiveCode
