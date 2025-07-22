import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'
import { pluginFrames } from '@expressive-code/plugin-frames'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { loadShikiThemeFromBundle, pluginShikiBundle, type PluginShikiBundleOptions } from '@expressive-code/plugin-shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { bundledLanguages, bundledThemes } from 'shiki'
import type { BundledLanguage, BundledTheme } from 'shiki'

const shikiOptions: PluginShikiBundleOptions<BundledLanguage, BundledTheme> = {
	engine: createJavaScriptRegexEngine,
	bundledLangs: bundledLanguages,
	bundledThemes: bundledThemes,
}

const options: RehypeExpressiveCodeCoreOptions<BundledTheme> = {
	themes: [],
	plugins: [pluginShikiBundle<BundledLanguage, BundledTheme>(shikiOptions), pluginFrames(), pluginTextMarkers()],
	customLoadTheme: (theme) => {
		return loadShikiThemeFromBundle(shikiOptions, theme)
	},
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
