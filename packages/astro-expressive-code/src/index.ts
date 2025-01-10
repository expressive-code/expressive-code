import type { AstroIntegration } from 'astro'
import type { BundledShikiLanguage, BundledShikiTheme, RehypeExpressiveCodeOptions } from 'rehype-expressive-code'
import rehypeExpressiveCode from 'rehype-expressive-code'
import { ConfigSetupHookArgs, PartialAstroConfig } from './astro-config'
import { AstroExpressiveCodeOptions, CustomConfigPreprocessors, ConfigPreprocessorFn, getEcConfigFileUrl, loadEcConfigFile, mergeEcConfigOptions } from './ec-config'
import { createAstroRenderer } from './renderer'
import { vitePluginAstroExpressiveCode } from './vite-plugin'

declare module 'rehype-expressive-code' {
	export interface PluginShikiOptions {
		/**
		 * Allows defining a subset of language IDs from the full Shiki bundle
		 * that should be available for syntax highlighting.
		 *
		 * In server-side rendering (SSR) environments, setting this option to the languages
		 * used on your site can reduce bundle size by up to 80%.
		 *
		 * If this option is not set, all languages from the full Shiki bundle are available.
		 */
		bundledLangs?: BundledShikiLanguage[] | undefined
		/**
		 * Controls whether any themes from the full Shiki bundle that are not used by your
		 * Expressive Code configuration should be removed from the final bundle.
		 *
		 * Defaults to `true`, which automatically reduces SSR bundle size by over 1 MB.
		 *
		 * If you need to access all themes on your site, you can set this option to `false`.
		 */
		removeUnusedThemes?: boolean | undefined
	}
}

export * from 'rehype-expressive-code'

export type { AstroExpressiveCodeOptions, PartialAstroConfig, CustomConfigPreprocessors, ConfigPreprocessorFn }
export * from './renderer'
export { mergeEcConfigOptions }

/**
 * Astro integration that adds Expressive Code support to code blocks in Markdown & MDX documents.
 */
export function astroExpressiveCode(integrationOptions: AstroExpressiveCodeOptions = {}) {
	const integration = {
		name: 'astro-expressive-code',
		hooks: {
			'astro:config:setup': async (args: unknown) => {
				const { command, config: astroConfig, updateConfig, logger, addWatchFile } = args as ConfigSetupHookArgs

				// Validate Astro configuration
				const ownPosition = astroConfig.integrations.findIndex((integration) => integration.name === 'astro-expressive-code')
				const mdxPosition = astroConfig.integrations.findIndex((integration) => integration.name === '@astrojs/mdx')
				if (ownPosition > -1 && mdxPosition > -1 && mdxPosition < ownPosition) {
					throw new Error(
						`Incorrect integration order: To allow code blocks on MDX pages to use
						astro-expressive-code, please move astroExpressiveCode() before mdx()
						in the "integrations" array of your Astro config file.`.replace(/\s+/g, ' ')
					)
				}

				// Watch the EC config file for changes (including creation/deletion)
				addWatchFile(getEcConfigFileUrl(astroConfig.root))

				// If an EC config file is present, load it and use it to override or extend
				// the options passed directly to the integration
				const ecConfigFileOptions = await loadEcConfigFile(astroConfig.root)
				const mergedOptions = mergeEcConfigOptions(integrationOptions, ecConfigFileOptions)

				// Preprocess the merged config if custom preprocessors were provided
				const processedEcConfig = (await mergedOptions.customConfigPreprocessors?.preprocessAstroIntegrationConfig({ ecConfig: mergedOptions, astroConfig })) || mergedOptions

				// Prepare config to pass to the rehype integration
				const { customCreateAstroRenderer } = processedEcConfig
				delete processedEcConfig.customCreateAstroRenderer
				delete processedEcConfig.customConfigPreprocessors

				const { hashedStyles, hashedScripts, ...renderer } = await (customCreateAstroRenderer ?? createAstroRenderer)({ astroConfig, ecConfig: processedEcConfig, logger })

				const rehypeExpressiveCodeOptions: RehypeExpressiveCodeOptions = {
					// Even though we have created a custom renderer, some options are used
					// by the rehype integration itself (e.g. `tabWidth`, `getBlockLocale`),
					// so we pass all of them through just to be safe
					...processedEcConfig,
					// Pass our custom renderer to the rehype integration
					customCreateRenderer: () => renderer,
				}

				updateConfig({
					vite: {
						plugins: [
							vitePluginAstroExpressiveCode({
								styles: hashedStyles,
								scripts: hashedScripts,
								ecIntegrationOptions: integrationOptions,
								processedEcConfig,
								astroConfig,
								command,
							}),
						],
					},
					markdown: {
						syntaxHighlight: false,
						rehypePlugins: [[rehypeExpressiveCode, rehypeExpressiveCodeOptions]],
					},
				})
			},
		},
	} satisfies AstroIntegration

	return integration
}

/**
 * A utility function that helps you define an Expressive Code configuration object. It is meant
 * to be used inside the optional config file `ec.config.mjs` located in the root directory
 * of your Astro project, and its return value to be exported as the default export.
 *
 * Expressive Code will automatically detect this file and use the exported configuration object
 * to override its own default settings.
 *
 * Using this function is recommended, but not required. It just passes through the given object,
 * but it also provides type information for your editor's auto-completion and type checking.
 *
 * @example
 * ```js
 * // ec.config.mjs
 * import { defineEcConfig } from 'astro-expressive-code'
 *
 * export default defineEcConfig({
 *   themes: ['dracula', 'github-light'],
 *   styleOverrides: {
 *     borderRadius: '0.5rem',
 *   },
 * })
 * ```
 */
export function defineEcConfig(config: AstroExpressiveCodeOptions) {
	return config
}

// Provide a default export for convenience and `astro add astro-expressive-code` compatibility
export default astroExpressiveCode
