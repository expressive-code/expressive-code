import type { VFileWithOutput } from 'unified'
import type { VFile } from 'vfile'
import { ExpressiveCodeTheme, ExpressiveCodeBlock, ExpressiveCodeCore, ExpressiveCodeEngine } from 'expressive-code/core'
import type { ExpressiveCodeBlockOptions, ExpressiveCodeCoreConfig } from 'expressive-code/core'
import type { Root, Parents, Element } from 'expressive-code/hast'
import { visit } from 'expressive-code/hast'
import { createInlineAssetElement, getCodeBlockInfo } from './utils'
import type { CodeBlockInfo } from './utils'
import type { Awaitable, LoadTheme, ThemeObjectOrBundleThemeName, RehypeExpressiveCodeEngineRenderer, RehypeExpressiveCodeCommonOptions } from './types'

export type RequireDefined<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> }

export type AnyVFile = VFile | VFileWithOutput<null>

export type CreateRendererDefaultOptions<E extends ExpressiveCodeCore, T extends string = never> = {
	ctor: new (...args: ConstructorParameters<typeof ExpressiveCodeEngine>) => E
} & ([T] extends [never] ? object : { loadTheme: LoadTheme<T> }) // loadTheme must be provided when T extends string

export async function createRendererCommon<E extends ExpressiveCodeEngine, T extends string = never>(
	options: RehypeExpressiveCodeCommonOptions<ExpressiveCodeCoreConfig, E, T>,
	defaultOptions: CreateRendererDefaultOptions<E, T>
): Promise<RehypeExpressiveCodeEngineRenderer<E>> {
	// Transfer deprecated `theme` option to `themes` without triggering the deprecation warning
	const deprecatedOptions: Omit<RehypeExpressiveCodeCommonOptions<ExpressiveCodeCoreConfig, E, T>, 'theme'> & {
		theme?: ThemeObjectOrBundleThemeName<T> | ThemeObjectOrBundleThemeName<T>[] | undefined
	} = options
	if (deprecatedOptions.theme && !options.themes) {
		options.themes = Array.isArray(deprecatedOptions.theme) ? deprecatedOptions.theme : [deprecatedOptions.theme]
		delete deprecatedOptions.theme
	}
	const { themes, ...ecOptions } = options
	const { ctor } = defaultOptions

	const loadedThemes =
		themes &&
		(await Promise.all(
			(Array.isArray(themes) ? themes : [themes])
				.filter((t) => !!t)
				.map(async (theme) => {
					if (theme instanceof ExpressiveCodeTheme) return theme
					if (typeof theme !== 'string') return new ExpressiveCodeTheme(theme)
					if ('customLoadTheme' in options && !!options.customLoadTheme) return new ExpressiveCodeTheme(await options.customLoadTheme(theme))
					if ('loadTheme' in defaultOptions && !!defaultOptions.loadTheme) return new ExpressiveCodeTheme(await defaultOptions.loadTheme(theme))
					throw new Error('unable to load theme, please use a supported theme type or provide a value for customLoadTheme')
				})
		))
	const ec = new ctor({
		themes: loadedThemes,
		...ecOptions,
	})
	const baseStyles = await ec.getBaseStyles()
	const themeStyles = await ec.getThemeStyles()
	const jsModules = await ec.getJsModules()

	return {
		ec,
		baseStyles,
		themeStyles,
		jsModules,
	}
}

export type RehypeExpressiveCodeCommonDefaultOptions<T extends string, E extends ExpressiveCodeEngine> = {
	createRenderer: RequireDefined<RehypeExpressiveCodeCommonOptions<ExpressiveCodeCoreConfig, E, T>, 'customCreateRenderer'>['customCreateRenderer']
}

export function rehypeExpressiveCodeCommon<T extends string, E extends ExpressiveCodeEngine>(
	options: RehypeExpressiveCodeCommonOptions<ExpressiveCodeCoreConfig, E, T>,
	defaultOptions: RehypeExpressiveCodeCommonDefaultOptions<T, E>
) {
	const { tabWidth = 2, getBlockLocale, customCreateRenderer, customCreateBlock } = options
	const { createRenderer } = defaultOptions

	let asyncRenderer: Awaitable<RehypeExpressiveCodeEngineRenderer<E>> | undefined

	const renderBlockToHast = async ({
		codeBlock,
		renderer,
		addedStyles,
		addedJsModules,
		useMdxJsx,
	}: {
		codeBlock: ExpressiveCodeBlock
		renderer: RehypeExpressiveCodeEngineRenderer<E>
		addedStyles: Set<string>
		addedJsModules: Set<string>
		useMdxJsx: boolean
	}): Promise<Element> => {
		const { ec, baseStyles, themeStyles, jsModules } = renderer

		// Try to render the current code block
		const { renderedGroupAst, styles } = await ec.render(codeBlock)

		// Collect any style and script elements that we need to add to the output
		const extraElements: Element['children'] = []
		const stylesToPrepend: string[] = []

		// Add any styles that we haven't added yet
		// - Base styles
		if (baseStyles && !addedStyles.has(baseStyles)) {
			addedStyles.add(baseStyles)
			stylesToPrepend.push(baseStyles)
		}
		// - Theme styles
		if (themeStyles && !addedStyles.has(themeStyles)) {
			addedStyles.add(themeStyles)
			stylesToPrepend.push(themeStyles)
		}
		// - Group-level styles
		for (const style of styles) {
			if (addedStyles.has(style)) continue
			addedStyles.add(style)
			stylesToPrepend.push(style)
		}
		// Combine all styles we collected (if any) into a single style element
		if (stylesToPrepend.length) {
			extraElements.push(
				createInlineAssetElement({
					tagName: 'style',
					innerHTML: stylesToPrepend.join(''),
					useMdxJsx,
				})
			)
		}

		// Create script elements for all JS modules we haven't added yet
		jsModules.forEach((moduleCode) => {
			if (addedJsModules.has(moduleCode)) return
			addedJsModules.add(moduleCode)
			extraElements.push(
				createInlineAssetElement({
					tagName: 'script',
					properties: { type: 'module' },
					innerHTML: moduleCode,
					useMdxJsx,
				})
			)
		})

		// Prepend any extra elements to the children of the renderedGroupAst wrapper,
		// which keeps them inside the wrapper and reduces the chance of CSS issues
		// caused by selectors like `* + *` on the parent level
		renderedGroupAst.children.unshift(...extraElements)

		return renderedGroupAst
	}

	const transformer = async (tree: Root, file: AnyVFile) => {
		const nodesToProcess: [Parents, CodeBlockInfo][] = []

		visit(tree, 'element', (element, index, parent) => {
			if (index === null || !parent) return
			const codeBlockInfo = getCodeBlockInfo(element)
			if (codeBlockInfo) nodesToProcess.push([parent, codeBlockInfo])
		})

		if (nodesToProcess.length === 0) return

		// We found at least one code node, so we need to ensure our renderer is available
		// and wait for its initialization if necessary
		if (asyncRenderer === undefined) {
			asyncRenderer = (customCreateRenderer ?? createRenderer)(options)
		}
		const renderer = await asyncRenderer

		// Determine how to render style and script elements based on the environment and file type
		// (Astro allows using regular HTML elements in MDX, while Next.js requires JSX)
		const isAstro = file.data?.astro !== undefined
		const isMdx = file.path?.endsWith('.mdx') ?? false
		const useMdxJsx = !isAstro && isMdx

		// Render all code blocks on the page while keeping track of the assets we already added
		const addedStyles = new Set<string>()
		const addedJsModules = new Set<string>()

		for (let groupIndex = 0; groupIndex < nodesToProcess.length; groupIndex++) {
			const [parent, code] = nodesToProcess[groupIndex]

			// Normalize the code coming from the Markdown/MDX document
			let normalizedCode = code.text
			if (tabWidth > 0) normalizedCode = normalizedCode.replace(/\t/g, ' '.repeat(tabWidth))

			// Build the ExpressiveCodeBlockOptions object that we will pass either
			// to the ExpressiveCodeBlock constructor or the customCreateBlock function
			const input: ExpressiveCodeBlockOptions = {
				code: normalizedCode,
				language: code.lang || '',
				meta: code.meta || '',
				parentDocument: {
					sourceFilePath: file.path,
					documentRoot: tree,
					positionInDocument: {
						groupIndex,
						totalGroups: nodesToProcess.length,
					},
				},
			}

			// Allow the user to customize the locale for this code block
			if (getBlockLocale) {
				input.locale = await getBlockLocale({ input, file })
			}

			// Allow the user to customize the ExpressiveCodeBlock instance
			const codeBlock = customCreateBlock ? await customCreateBlock({ input, file }) : new ExpressiveCodeBlock(input)

			// Render the code block and use it to replace the found `<pre>` element
			const renderedBlock = await renderBlockToHast({ codeBlock, renderer, addedStyles, addedJsModules, useMdxJsx })
			parent.children.splice(parent.children.indexOf(code.pre), 1, renderedBlock)
		}
	}

	return transformer
}
