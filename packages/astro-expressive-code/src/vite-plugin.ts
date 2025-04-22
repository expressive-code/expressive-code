import type { HookParameters, ViteUserConfig } from 'astro'
import type { BundledShikiLanguage } from 'rehype-expressive-code'
import { stableStringify } from 'rehype-expressive-code'
import { getEcConfigFileUrl } from './ec-config'
import type { PartialAstroConfig } from './astro-config'
import { serializePartialAstroConfig } from './astro-config'
import type { AstroExpressiveCodeOptions } from './ec-config'

/**
 * This Vite plugin provides access to page-wide styles & scripts that the Astro integration
 * extracted from its `RehypeExpressiveCodeRenderer`. We extract these contents from the renderer
 * to prevent the rehype plugin from repeatedly injecting them into the HTML output of every page
 * while still allowing pages to load them on demand if they contain code blocks.
 */
export function vitePluginAstroExpressiveCode({
	styles,
	scripts,
	ecIntegrationOptions,
	processedEcConfig,
	astroConfig,
	command,
}: {
	styles: [string, string][]
	scripts: [string, string][]
	ecIntegrationOptions: AstroExpressiveCodeOptions
	processedEcConfig: AstroExpressiveCodeOptions
	astroConfig: PartialAstroConfig
	command: HookParameters<'astro:config:setup'>['command']
}): NonNullable<ViteUserConfig['plugins']>[number] {
	const modules: Record<string, string> = {}

	// Create virtual config module
	const configModuleContents: string[] = []
	// - Partial Astro config
	configModuleContents.push(`export const astroConfig = ${serializePartialAstroConfig(astroConfig)}`)
	// - Expressive Code integration options
	const { customConfigPreprocessors, ...otherEcIntegrationOptions } = ecIntegrationOptions
	configModuleContents.push(`export const ecIntegrationOptions = ${stableStringify(otherEcIntegrationOptions)}`)
	// - Expressive Code config file options
	const strEcConfigFileUrlHref = JSON.stringify(getEcConfigFileUrl(astroConfig.root).href)
	configModuleContents.push(
		`let ecConfigFileOptions = {}`,
		`try {`,
		`	ecConfigFileOptions = (await import('virtual:astro-expressive-code/ec-config')).default`,
		`} catch (e) {`,
		`	console.error('*** Failed to load Expressive Code config file ${strEcConfigFileUrlHref}. You can ignore this message if you just renamed/removed the file.\\n\\n(Full error message: "' + (e?.message || e) + '")\\n')`,
		`}`,
		`export { ecConfigFileOptions }`
	)
	modules['virtual:astro-expressive-code/config'] = configModuleContents.join('\n')

	// This is a fallback that will only be used when no config file is present
	modules['virtual:astro-expressive-code/ec-config'] = 'export default {}'

	// Create virtual config preprocessor module
	modules['virtual:astro-expressive-code/preprocess-config'] = customConfigPreprocessors?.preprocessComponentConfig || `export default ({ ecConfig }) => ecConfig`

	// Prepare Shiki-related SSR bundle trimming
	const shikiConfig = typeof processedEcConfig.shiki === 'object' ? processedEcConfig.shiki : {}
	const configuredEngine = shikiConfig.engine === 'javascript' ? 'javascript' : 'oniguruma'
	// Extract any bundled theme names from the config, supporting the deprecated `theme` option
	// and the current `themes` option
	const anyThemeOrThemes = processedEcConfig as unknown as { theme: string | string[]; themes: string | string[] }
	const effectiveThemesOrTheme = anyThemeOrThemes.themes ?? anyThemeOrThemes.theme ?? []
	const effectiveThemes = Array.isArray(effectiveThemesOrTheme) ? effectiveThemesOrTheme : [effectiveThemesOrTheme]
	const configuredBundledThemes = effectiveThemes.filter((theme) => typeof theme === 'string')
	const shikiAssetRegExp = /(?<=\n)\s*\{[\s\S]*?"id": "(.*?)",[\s\S]*?\n\s*\},?\s*\n/g

	const noQuery = (source: string) => source.split('?')[0]

	const getVirtualModuleContents = (source: string) => {
		// In dev mode, serve the extracted styles & scripts as virtual modules
		if (command === 'dev') {
			for (const file of [...styles, ...scripts]) {
				const [fileName, contents] = file
				if (noQuery(fileName) === noQuery(source)) return contents
			}
		}
		return source in modules ? modules[source] : undefined
	}

	return [
		{
			name: 'vite-plugin-astro-expressive-code',
			async resolveId(source, importer) {
				// Resolve virtual API module to the current package entrypoint
				if (source === 'virtual:astro-expressive-code/api') {
					const resolved = await this.resolve('astro-expressive-code', importer)
					if (resolved) return resolved
					return await this.resolve('astro-expressive-code')
				}
				// Resolve EC config file if present
				if (source === 'virtual:astro-expressive-code/ec-config') {
					const resolved = await this.resolve('./ec.config.mjs')
					if (resolved) return resolved
				}
				// Resolve other virtual modules
				if (getVirtualModuleContents(source)) return `\0${source}`
			},
			load: (id) => (id?.[0] === '\0' ? getVirtualModuleContents(id.slice(1)) : undefined),
			// If any file imported by the EC config file changes, restart the server
			async handleHotUpdate({ modules, server }) {
				if (!modules || !server) return
				const isImportedByEcConfig = (module: (typeof modules)[0], depth: number = 0) => {
					if (!module || !module.importers || depth >= 6) return false
					for (const importingModule of module.importers) {
						if (noQuery(module.url).endsWith('/ec.config.mjs')) {
							return true
						}
						if (isImportedByEcConfig(importingModule, depth + 1)) return true
					}
					return false
				}
				if (modules.some((module) => isImportedByEcConfig(module))) {
					await server.restart()
				}
			},
			transform: (code, id) => {
				// Modify plugin-shiki to reduce bundle size
				if (id.includes('/plugin-shiki/dist/')) {
					// Remove references to unused Shiki RegExp engines
					return code.replace(/(return \[)(?:.*?shiki\/engine\/(javascript|oniguruma).*?)(\]\[0\])/g, (match, prefix, engine, suffix) => {
						if (engine === configuredEngine) return match
						return `${prefix}undefined${suffix}`
					})
				}

				// Unless disabled, trim the bundled Shiki themes to only those used in the config
				if (processedEcConfig.removeUnusedThemes !== false && id.match(/\/shiki\/dist\/themes\.m?js$/)) {
					return code.replace(shikiAssetRegExp, (match, bundledTheme) => {
						if (configuredBundledThemes.includes(bundledTheme as string)) return match
						return ''
					})
				}

				// If an allow list was given, trim the bundled Shiki languages to those in the list
				if (shikiConfig.bundledLangs && id.match(/\/shiki\/dist\/langs\.m?js$/)) {
					return code.replace(shikiAssetRegExp, (match, bundledLang) => {
						if (shikiConfig.bundledLangs!.includes(bundledLang as BundledShikiLanguage)) return match
						return ''
					})
				}
			},
		},
		// Add a second plugin that only runs in build mode (to avoid Vite warnings about emitFile)
		// which emits the extracted styles & scripts as static assets
		{
			name: 'vite-plugin-astro-expressive-code-build',
			apply: 'build',
			buildEnd() {
				for (const file of [...styles, ...scripts]) {
					const [fileName, source] = file
					this.emitFile({
						type: 'asset',
						// Remove leading slash and any query params
						fileName: noQuery(fileName.slice(1)),
						source,
					})
				}
			},
		},
	]
}
