import type { AstroIntegration } from 'astro'
import type { RemarkExpressiveCodeOptions } from 'remark-expressive-code'
import remarkExpressiveCode, { createRenderer, getStableObjectHash } from 'remark-expressive-code'
import { vitePluginAstroExpressiveCode } from './vite-plugin'

export * from 'remark-expressive-code'

export type AstroExpressiveCodeOptions = RemarkExpressiveCodeOptions & {
	/**
	 * Determines if the styles required to display code blocks should be emitted into a separate
	 * CSS file rather than being inlined into the rendered HTML of the first code block per page.
	 *
	 * This is recommended for sites containing multiple pages with code blocks, as it will reduce
	 * the overall footprint of the site when navigating between pages.
	 *
	 * The generated URL is located inside Astro's assets directory and includes a content hash
	 * so it can be cached indefinitely by browsers. If you are using the default values for the
	 * Astro config options `base`, `build.assets`, `build.assetsPrefix`, the resulting URL
	 * will be `/_astro/ec.{hash}.css`.
	 *
	 * **Important**: To actually benefit from caching, please ensure that your hosting provider
	 * serves the contents of the assets directory as immutable files with a long cache lifetime,
	 * e.g. `Cache-Control: public,max-age=31536000,immutable`.
	 *
	 * @default true
	 */
	emitExternalStylesheet?: boolean | undefined
}

/**
 * Astro integration that adds Expressive Code support to code blocks in Markdown & MDX documents.
 */
export function astroExpressiveCode(options: AstroExpressiveCodeOptions = {}) {
	// As the arguments of the `astro:config:setup` hook are incompatible between Astro versions,
	// we just access this type internally and accept `unknown` args externally to prevent
	// version-specific types from being included in the build output
	type ConfigSetupHookArgs = Parameters<NonNullable<AstroIntegration['hooks']['astro:config:setup']>>[0]

	const integration = {
		name: 'astro-expressive-code',
		hooks: {
			'astro:config:setup': async (args: unknown) => {
				const { config, updateConfig, injectRoute, logger } = args as ConfigSetupHookArgs
				const { emitExternalStylesheet = true, customCreateRenderer, plugins = [], shiki = true, ...rest } = options ?? {}

				// Validate Astro configuration
				const ownPosition = config.integrations.findIndex((integration) => integration.name === 'astro-expressive-code')
				const mdxPosition = config.integrations.findIndex((integration) => integration.name === '@astrojs/mdx')
				if (ownPosition > -1 && mdxPosition > -1 && mdxPosition < ownPosition) {
					throw new Error(
						`Incorrect integration order: To allow code blocks on MDX pages to use
						astro-expressive-code, please move astroExpressiveCode() before mdx()
						in the "integrations" array of your Astro config file.`.replace(/\s+/g, ' ')
					)
				}

				// Determine the assets directory and href prefix from the Astro config
				const assetsDir = config.build?.assets || '_astro'
				const assetsHrefPrefix = (config?.build?.assetsPrefix || config?.base || '').trim().replace(/\/+$/g, '')

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

							// Add a hashed stylesheet links
							hashedStyles.forEach(([hashedRoute]) => {
								extraElements.push({
									type: 'element',
									tagName: 'link',
									properties: { rel: 'stylesheet', href: `${assetsHrefPrefix}${hashedRoute}` },
									children: [],
								})
							})

							// Add hashed script module links for all JS modules
							hashedScripts.forEach(([hashedRoute]) => {
								extraElements.push({
									type: 'element',
									tagName: 'script',
									properties: { type: 'module', src: `${assetsHrefPrefix}${hashedRoute}` },
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
				if (mergedShikiConfig && !mergedShikiConfig.langs && config.markdown?.shikiConfig?.langs) {
					mergedShikiConfig.langs = config.markdown.shikiConfig.langs as NonNullable<typeof mergedShikiConfig.langs>
				}

				// Create the renderer
				const renderer = await (customCreateRenderer ?? createRenderer)({
					plugins,
					logger,
					shiki: mergedShikiConfig,
					...rest,
				})

				// Unless disabled, move the base and theme styles from the inline renderer
				// into an external CSS file that can be cached by browsers
				if (emitExternalStylesheet) {
					const combinedStyles = `${renderer.baseStyles}${renderer.themeStyles}`
					hashedStyles.push(getHashedRouteWithContent(combinedStyles, `/${assetsDir}/ec.{hash}.css`))
					renderer.baseStyles = ''
					renderer.themeStyles = ''
				}

				// Also move any JS modules into external files
				// (this is always enabled because the alternative using `injectScript`
				// does not allow omitting the scripts on pages without any code blocks)
				const uniqueJsModules = [...new Set<string>(renderer.jsModules)]
				renderer.jsModules = []
				hashedScripts.push(...uniqueJsModules.map((moduleCode) => getHashedRouteWithContent(moduleCode, `/${assetsDir}/ec.{hash}.js`)))

				// Inject route handlers that provide access to the extracted styles & scripts
				hashedStyles.forEach(([hashedRoute]) => {
					const entrypoint = new URL('../routes/styles.ts', import.meta.url).href
					injectRoute({
						pattern: hashedRoute,
						entryPoint: entrypoint,
						// @ts-expect-error: `entrypoint` is the new name since Astro 4
						entrypoint,
					})
				})
				hashedScripts.forEach(([hashedRoute]) => {
					const entrypoint = new URL('../routes/scripts.ts', import.meta.url).href
					injectRoute({
						pattern: hashedRoute,
						entryPoint: entrypoint,
						// @ts-expect-error: `entrypoint` is the new name since Astro 4
						entrypoint,
					})
				})

				const remarkExpressiveCodeOptions: RemarkExpressiveCodeOptions = {
					customCreateRenderer: () => renderer,
					plugins,
					logger,
					shiki: mergedShikiConfig,
					...rest,
				}

				updateConfig({
					vite: {
						plugins: [
							// Add the Vite plugin that provides all data for the route handler
							vitePluginAstroExpressiveCode({
								styles: hashedStyles,
								scripts: hashedScripts,
							}),
						],
					},
					markdown: {
						syntaxHighlight: false,
						remarkPlugins: [[remarkExpressiveCode, remarkExpressiveCodeOptions]],
					},
				})
			},
		},
	} satisfies AstroIntegration

	return integration
}

// Provide a default export for convenience and `astro add astro-expressive-code` compatibility
export default astroExpressiveCode

/**
 * Generates a hashed route and content tuple for a given content string.
 */
function getHashedRouteWithContent(content: string, routeTemplate: string): [string, string] {
	const contentHash = getStableObjectHash(content, { hashLength: 5 })
	return [routeTemplate.replace('{hash}', contentHash), content]
}
