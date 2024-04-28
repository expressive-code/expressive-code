import type { AstroIntegration } from 'astro'
import type { RehypeExpressiveCodeOptions } from 'rehype-expressive-code'
import rehypeExpressiveCode from 'rehype-expressive-code'
import { ConfigSetupHookArgs, PartialAstroConfig } from './astro-config'
import { AstroExpressiveCodeOptions, CustomConfigPreprocessors, ConfigPreprocessorFn, getEcConfigFileUrl, loadEcConfigFile } from './ec-config'
import { createAstroRenderer } from './renderer'
import { vitePluginAstroExpressiveCode } from './vite-plugin'

export * from 'rehype-expressive-code'

export type { AstroExpressiveCodeOptions, PartialAstroConfig, CustomConfigPreprocessors, ConfigPreprocessorFn }
export * from './renderer'

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

				// Merge the given options with the ones from a potential EC config file
				const ecConfigFileOptions = await loadEcConfigFile(astroConfig.root)
				const mergedOptions: AstroExpressiveCodeOptions = { ...ecConfigFileOptions, ...integrationOptions }

				// Warn if the user is both using an EC config file and passing options directly
				const forwardedIntegrationOptions = { ...integrationOptions }
				delete forwardedIntegrationOptions.customConfigPreprocessors
				if (Object.keys(ecConfigFileOptions).length > 0 && Object.keys(forwardedIntegrationOptions).length > 0) {
					logger.warn(
						`Your project includes an Expressive Code config file ("ec.config.mjs"),
						but your Astro config file also contains Expressive Code options.
						To avoid unexpected results from merging multiple config sources,
						move all Expressive Code options into its config file.
						Found options: ${Object.keys(forwardedIntegrationOptions).join(', ')}`.replace(/\s+/g, ' ')
					)
				}

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
