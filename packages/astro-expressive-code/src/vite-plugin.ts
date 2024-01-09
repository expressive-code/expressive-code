import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ViteUserConfig } from 'astro'

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`
}

/**
 * This Vite plugin provides access to page-wide styles & scripts that the Astro integration
 * extracted from its `RemarkExpressiveCodeRenderer`. We extract these contents from the renderer
 * to prevent the remark plugin from repeatedly injecting them into the HTML output of every page
 * while still allowing pages to load them on demand if they contain code blocks.
 *
 * All data is provided as virtual modules under the `virtual:astro-expressive-code/*` namespace,
 * which can be used by injected routes to generate CSS & JS files.
 */
export function vitePluginAstroExpressiveCode(options: { styles: [string, string][]; scripts: [string, string][]; root: URL }): NonNullable<ViteUserConfig['plugins']>[number] {
	// Map virtual module names to their code contents as strings
	const modules: Record<string, string> = {
		'virtual:astro-expressive-code/scripts': `export const scripts = ${JSON.stringify(options.scripts)}`,
		'virtual:astro-expressive-code/styles': `export const styles = ${JSON.stringify(options.styles)}`,
	}

	// Try to find an EC config file in the Astro project root
	const projectRootPath = fileURLToPath(options.root)
	const possibleConfigFileNames = ['ec.config.ts', 'ec.config.mjs', 'ec.config.js'].map((fileName) => resolve(projectRootPath, fileName))
	const ecConfigFile = possibleConfigFileNames.find((fileName) => existsSync(fileName))
	const configModuleContents = ecConfigFile ? `export { default as config } from ${JSON.stringify(ecConfigFile)}` : `export const config = {}`
	modules['virtual:astro-expressive-code/config'] = configModuleContents

	// Create a map of module names prefixed with `\0` to their original form
	const resolutionMap = Object.fromEntries(Object.keys(modules).map((key) => [resolveVirtualModuleId(key), key]))

	return {
		name: 'vite-plugin-astro-expressive-code',
		resolveId(id): string | void {
			if (id in modules) return resolveVirtualModuleId(id)
		},
		load(id): string | void {
			const resolution = resolutionMap[id]
			if (resolution) return modules[resolution]
		},
	}
}
