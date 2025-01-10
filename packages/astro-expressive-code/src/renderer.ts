import { RehypeExpressiveCodeRenderer, createRenderer, getStableObjectHash } from 'rehype-expressive-code'
import { AstroExpressiveCodeOptions } from './ec-config'
import { PartialAstroConfig, ConfigSetupHookArgs, getAssetsBaseHref } from './astro-config'

export type CreateAstroRendererArgs = {
	ecConfig: AstroExpressiveCodeOptions
	astroConfig: PartialAstroConfig
	logger?: ConfigSetupHookArgs['logger'] | undefined
}

export type AstroExpressiveCodeRenderer = RehypeExpressiveCodeRenderer & {
	hashedStyles: [string, string][]
	hashedScripts: [string, string][]
}

export async function createAstroRenderer({ ecConfig, astroConfig, logger }: CreateAstroRendererArgs): Promise<AstroExpressiveCodeRenderer> {
	// Process the merged options and apply defaults
	const { emitExternalStylesheet = true, customCreateRenderer, plugins = [], shiki = true, ...rest } = ecConfig ?? {}

	// Determine the assets directory and href prefix from the Astro config
	const assetsDir = astroConfig.build?.assets || '_astro'

	// Add a plugin that inserts external references to the styles and scripts
	// that would normally be inlined into the first code block of every page
	const hashedStyles: [string, string][] = []
	const hashedScripts: [string, string][] = []
	plugins.push({
		name: 'astro-expressive-code',
		hooks: {
			postprocessRenderedBlockGroup: ({ renderData, renderedGroupContents }) => {
				// Only continue if this is the first code block group of the page
				const isFirstGroupInDocument = renderedGroupContents[0]?.codeBlock.parentDocument?.positionInDocument?.groupIndex === 0
				if (!isFirstGroupInDocument) return

				type HastElement = Extract<(typeof renderData.groupAst.children)[number], { type: 'element' }>
				const extraElements: HastElement[] = []

				// Add hashed stylesheet links
				hashedStyles.forEach(([hashedRoute]) => {
					extraElements.push({
						type: 'element',
						tagName: 'link',
						properties: { rel: 'stylesheet', href: `${getAssetsBaseHref('.css', astroConfig.build?.assetsPrefix, astroConfig.base)}${hashedRoute}` },
						children: [],
					})
				})

				// Add hashed script module links for all JS modules
				hashedScripts.forEach(([hashedRoute]) => {
					extraElements.push({
						type: 'element',
						tagName: 'script',
						properties: { type: 'module', src: `${getAssetsBaseHref('.js', astroConfig.build?.assetsPrefix, astroConfig.base)}${hashedRoute}` },
						children: [],
					})
				})

				if (!extraElements.length) return
				renderData.groupAst.children.unshift(...extraElements)
			},
		},
	})

	// Unless Shiki was disabled, merge any supported Shiki settings
	// from the Astro config into the plugin options
	const mergedShikiConfig = shiki === true ? {} : shiki
	const astroShikiConfig = astroConfig.markdown?.shikiConfig
	if (mergedShikiConfig) {
		if (!mergedShikiConfig.langs && astroShikiConfig?.langs) mergedShikiConfig.langs = astroShikiConfig.langs as NonNullable<typeof mergedShikiConfig.langs>
		if (!mergedShikiConfig.langAlias && astroShikiConfig?.langAlias) mergedShikiConfig.langAlias = astroShikiConfig.langAlias
	}

	// Create the renderer
	const renderer = (await (customCreateRenderer ?? createRenderer)({
		plugins,
		logger,
		shiki: mergedShikiConfig,
		...rest,
	})) as AstroExpressiveCodeRenderer
	renderer.hashedStyles = hashedStyles
	renderer.hashedScripts = hashedScripts

	// Unless disabled, move the base and theme styles from the inline renderer
	// into an external CSS file that can be cached by browsers
	if (emitExternalStylesheet) {
		const combinedStyles = `${renderer.baseStyles}${renderer.themeStyles}`
		hashedStyles.push(getHashedRouteWithContent(combinedStyles, `/${assetsDir}/ec.{hash}.css`))
		renderer.baseStyles = ''
		renderer.themeStyles = ''
	}

	// Also move any JS modules into a single external file
	// (this is always enabled because the alternative using `injectScript`
	// does not allow omitting the scripts on pages without any code blocks)
	const uniqueJsModules = [...new Set<string>(renderer.jsModules)]
	const mergedJsCode = uniqueJsModules.join('\n')
	renderer.jsModules = []
	hashedScripts.push(getHashedRouteWithContent(mergedJsCode, `/${assetsDir}/ec.{hash}.js`))

	return renderer
}

/**
 * Generates a hashed route and content tuple for a given content string.
 */
function getHashedRouteWithContent(content: string, routeTemplate: string): [string, string] {
	const contentHash = getStableObjectHash(content, { hashLength: 5 })
	return [routeTemplate.replace('{hash}', contentHash), content]
}
