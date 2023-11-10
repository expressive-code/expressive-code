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
export function vitePluginAstroExpressiveCode(contents: { styles: [string, string][]; scripts: [string, string][] }): NonNullable<ViteUserConfig['plugins']>[number] {
	// Map virtual module names to their code contents as strings
	const modules = {
		'virtual:astro-expressive-code/scripts': `export const scripts = ${JSON.stringify(contents.scripts)}`,
		'virtual:astro-expressive-code/styles': `export const styles = ${JSON.stringify(contents.styles)}`,
	} satisfies Record<string, string>

	// Create a map of module names prefixed with `\0` to their original form
	const resolutionMap = Object.fromEntries((Object.keys(modules) as (keyof typeof modules)[]).map((key) => [resolveVirtualModuleId(key), key]))

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
