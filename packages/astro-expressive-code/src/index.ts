import type { AstroIntegration } from 'astro'
import type { RemarkExpressiveCodeOptions } from 'remark-expressive-code'
import remarkExpressiveCode, { createRenderer } from 'remark-expressive-code'

export * from 'remark-expressive-code'

export type AstroExpressiveCodeOptions = RemarkExpressiveCodeOptions

/**
 * Astro integration that adds Expressive Code support to code blocks in Markdown & MDX documents.
 */
export function astroExpressiveCode(options: AstroExpressiveCodeOptions): AstroIntegration {
	return {
		name: 'astro-expressive-code',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, injectScript }) => {
				const { customRenderer } = options ?? {}

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

				// Prepare the renderer
				const renderer = customRenderer ?? (await createRenderer(options))

				// Extract JS modules from the renderer as we will handle them ourselves
				const jsModules = renderer.jsModules ?? []
				renderer.jsModules = []

				updateConfig({
					markdown: {
						syntaxHighlight: false,
						remarkPlugins: [[remarkExpressiveCode, { ...options, customRenderer: renderer }]],
					},
				})

				jsModules.forEach((moduleCode) => injectScript('page', moduleCode))
			},
		},
	}
}
