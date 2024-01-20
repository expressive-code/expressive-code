import type { AstroIntegration } from 'astro'

// As the arguments of the `astro:config:setup` hook are incompatible between Astro versions,
// we just access this type internally and accept `unknown` args externally to prevent
// version-specific types from being included in the build output
export type ConfigSetupHookArgs = Parameters<NonNullable<AstroIntegration['hooks']['astro:config:setup']>>[0]

/**
 * Contains the parts of the Astro config that are used by this integration.
 */
export type PartialAstroConfig = {
	base: string
	build?:
		| Partial<{
				assets: string
				assetsPrefix: string | undefined
		  }>
		| undefined
	markdown?:
		| Partial<{
				shikiConfig: Partial<{
					langs: ConfigSetupHookArgs['config']['markdown']['shikiConfig']['langs']
				}>
		  }>
		| undefined
	root: URL
	srcDir: URL
}

export function serializePartialAstroConfig(config: PartialAstroConfig): string {
	const partialConfig: PartialAstroConfig = {
		base: config.base,
		root: config.root,
		srcDir: config.srcDir,
	}
	if (config.build) {
		partialConfig.build = {}
		if (config.build.assets) partialConfig.build.assets = config.build.assets
		if (config.build.assetsPrefix) partialConfig.build.assetsPrefix = config.build.assetsPrefix
	}
	if (config.markdown?.shikiConfig?.langs) {
		partialConfig.markdown = { shikiConfig: { langs: config.markdown.shikiConfig.langs } }
	}
	return JSON.stringify(partialConfig)
}
