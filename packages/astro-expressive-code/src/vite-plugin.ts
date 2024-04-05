import type { ViteUserConfig } from 'astro'
import { stableStringify } from 'remark-expressive-code'
import { getEcConfigFileUrl } from './ec-config'
import { PartialAstroConfig, serializePartialAstroConfig } from './astro-config'
import { AstroExpressiveCodeOptions } from './ec-config'

/**
 * This Vite plugin provides access to page-wide styles & scripts that the Astro integration
 * extracted from its `RemarkExpressiveCodeRenderer`. We extract these contents from the renderer
 * to prevent the remark plugin from repeatedly injecting them into the HTML output of every page
 * while still allowing pages to load them on demand if they contain code blocks.
 */
export function vitePluginAstroExpressiveCode({
	styles,
	scripts,
	ecIntegrationOptions,
	astroConfig,
	command,
}: {
	styles: [string, string][]
	scripts: [string, string][]
	ecIntegrationOptions: AstroExpressiveCodeOptions
	astroConfig: PartialAstroConfig
	command: 'dev' | 'build' | 'preview'
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

	const getVirtualModuleContents = (source: string) => {
		// In dev mode, serve the extracted styles & scripts as virtual modules
		if (command === 'dev') {
			const sourceWithoutQuery = source.split('?')[0]
			for (const file of [...styles, ...scripts]) {
				const [fileName, contents] = file
				if (fileName === sourceWithoutQuery) return contents
			}
		}
		return source in modules ? modules[source] : undefined
	}

	return {
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
		buildEnd() {
			// In build mode, emit the extracted styles & scripts as static assets
			if (command === 'build') {
				for (const file of [...styles, ...scripts]) {
					const [fileName, source] = file
					this.emitFile({
						type: 'asset',
						// Remove leading slash (e.g. `_astro/ec.o4qcx.css`)
						fileName: fileName.slice(1),
						source,
					})
				}
			}
		},
	}
}
