import type { VFileWithOutput } from 'unified'
import { loadShikiTheme, ExpressiveCode, ExpressiveCodeTheme, ExpressiveCodeBlockOptions, ExpressiveCodeBlock } from 'expressive-code'
import { toHtml } from 'hast-util-to-html'
import { NodeData } from './document'
import { RemarkExpressiveCodeOptions, SingleThemeRemarkExpressiveCodeOptions } from '.'

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

export async function prepareGroupRenderInput({
	nodeGroup,
	parentDocument,
	tabWidth,
	getBlockLocale,
	file,
}: {
	nodeGroup: NodeData[]
	parentDocument: ExpressiveCodeBlockOptions['parentDocument']
	tabWidth: number
	getBlockLocale: RemarkExpressiveCodeOptions['getBlockLocale']
	file: VFileWithOutput<null>
}): Promise<ExpressiveCodeBlockOptions[]> {
	// Build an array of ExpressiveCodeBlockOptions
	// representing all code blocks in the group
	const groupBlockOptions: ExpressiveCodeBlockOptions[] = []
	for (const [, code] of nodeGroup) {
		// Normalize the code coming from the Markdown/MDX document
		let normalizedCode = code.value
		if (tabWidth > 0) normalizedCode = normalizedCode.replace(/\t/g, ' '.repeat(tabWidth))

		// Build the ExpressiveCodeBlockOptions object that we will pass either
		// to the ExpressiveCodeBlock constructor or the customCreateBlock function
		const blockOptions: ExpressiveCodeBlockOptions = {
			code: normalizedCode,
			language: code.lang || '',
			meta: code.meta || '',
			parentDocument,
		}

		// Allow the user to customize the locale for this code block
		if (getBlockLocale) {
			blockOptions.locale = await getBlockLocale({ input: blockOptions, file })
		}

		groupBlockOptions.push(blockOptions)
	}

	return groupBlockOptions
}

export async function renderGroupToHtml({
	groupRenderInput,
	renderer,
	customCreateBlock,
	file,
	addedStyles,
	addedJsModules,
}: {
	groupRenderInput: ExpressiveCodeBlockOptions[]
	renderer: RemarkExpressiveCodeRenderer
	customCreateBlock: RemarkExpressiveCodeOptions['customCreateBlock']
	file: VFileWithOutput<null>
	addedStyles: Set<string>
	addedJsModules: Set<string>
}): Promise<string> {
	const { ec, baseStyles, jsModules } = renderer

	// Create an array of fresh ExpressiveCodeBlock instances from the group render input
	// to prevent any modifications during instance creation from affecting other renderers
	const codeBlockGroup: ExpressiveCodeBlock[] = []
	for (const blockInput of groupRenderInput) {
		const input = { ...blockInput }

		// Allow the user to customize the ExpressiveCodeBlock instance
		const codeBlock = customCreateBlock ? await customCreateBlock({ input, file }) : new ExpressiveCodeBlock(input)
		codeBlockGroup.push(codeBlock)
	}

	// Try to render the current code block group
	const { renderedGroupAst, styles } = await ec.render(codeBlockGroup)

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
