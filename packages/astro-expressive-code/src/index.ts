import type { AstroIntegration } from 'astro'
import type { RemarkExpressiveCodeOptions } from 'remark-expressive-code'
import remarkExpressiveCode, { createRenderers } from 'remark-expressive-code'

export * from 'remark-expressive-code'

export type AstroExpressiveCodeOptions = RemarkExpressiveCodeOptions

/**
 * Astro integration that adds Expressive Code support to code blocks in Markdown & MDX documents.
 */
export function astroExpressiveCode(options: AstroExpressiveCodeOptions = {}) {
	// As the arguments of the `astro:config:setup` hook are incompatible between Astro 2 and 3,
	// we just access this type internally and accept `unknown` args externally to prevent
	// version-specific types from being included in the build output
	type ConfigSetupHookArgs = Parameters<NonNullable<AstroIntegration['hooks']['astro:config:setup']>>[0]

	const integration = {
		name: 'astro-expressive-code',
		hooks: {
			'astro:config:setup': async (args: unknown) => {
				const { config, updateConfig, injectScript } = args as ConfigSetupHookArgs
				const { customCreateRenderers } = options ?? {}

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

				// Prepare the renderers
				const renderers = await (customCreateRenderers ?? createRenderers)(options)

				// Extract deduplicated JS modules from the renderers as we handle them ourselves
				const jsModules = new Set<string>()
				renderers.forEach((renderer) => {
					renderer.jsModules.forEach((jsModule) => jsModules.add(jsModule))
					renderer.jsModules = []
				})

				const remarkExpressiveCodeOptions: RemarkExpressiveCodeOptions = {
					...options,
					customCreateRenderers: () => renderers,
				}

				updateConfig({
					markdown: {
						syntaxHighlight: false,
						remarkPlugins: [[remarkExpressiveCode, remarkExpressiveCodeOptions]],
					},
				})

				jsModules.forEach((moduleCode) => injectScript('page', moduleCode))
			},
		},
	} satisfies AstroIntegration

	return integration
}

// Provide a default export for convenience and `astro add astro-expressive-code` compatibility
export default astroExpressiveCode
