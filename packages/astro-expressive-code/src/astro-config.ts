import type { AstroIntegration } from 'astro'

// As the arguments of the `astro:config:setup` hook are incompatible between Astro versions,
// we just access this type internally and accept `unknown` args externally to prevent
// version-specific types from being included in the build output
export type ConfigSetupHookArgs = Parameters<NonNullable<AstroIntegration['hooks']['astro:config:setup']>>[0]
export type AstroConfig = ConfigSetupHookArgs['config']
export type AssetsPrefix = AstroConfig['build']['assetsPrefix']

/**
 * Contains the parts of the Astro config that are used by this integration.
 */
export type PartialAstroConfig = Pick<AstroConfig, 'base' | 'root' | 'srcDir'> & {
	build?: Partial<Pick<AstroConfig['build'], 'assets' | 'assetsPrefix'>> | undefined
	markdown?:
		| Partial<{
				shikiConfig: Partial<Pick<AstroConfig['markdown']['shikiConfig'], 'langs'>>
		  }>
		| undefined
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

function getAssetsPrefix(fileExtension: string, assetsPrefix?: AssetsPrefix): string {
	if (!assetsPrefix) return ''
	if (typeof assetsPrefix === 'string') return assetsPrefix
	// we assume the file extension has a leading '.' and we remove it
	const dotLessFileExtension = fileExtension.slice(1)
	if (assetsPrefix[dotLessFileExtension]) {
		return assetsPrefix[dotLessFileExtension]
	}
	return assetsPrefix.fallback
}

/**
 * Returns the base URL href for assets with the given file extension (e.g. `.js`).
 *
 * The returned value does not include a trailing slash.
 */
export function getAssetsBaseHref(fileExtension: string, assetsPrefix: AssetsPrefix | undefined, base: string | undefined): string {
	return (getAssetsPrefix(fileExtension, assetsPrefix) || base || '').trim().replace(/\/+$/g, '')
}
