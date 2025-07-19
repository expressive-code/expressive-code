import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'
import { loadShikiThemeFromBundle, pluginShikiBundle, type PluginShikiBundleOptions } from '@expressive-code/plugin-shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

type BundledLanguage = 'javascript'
type BundledTheme = 'light-plus'

const shikiOptions: PluginShikiBundleOptions<BundledLanguage, BundledTheme> = {
	engine: createJavaScriptRegexEngine,
	bundledLangs: {
		javascript: () => import('shiki/langs/javascript.mjs'),
	},
	bundledThemes: {
		'light-plus': () => import('shiki/themes/light-plus.mjs'),
	},
}

const options: RehypeExpressiveCodeCoreOptions<BundledTheme> = {
	themes: [(await import('shiki/themes/dracula.mjs')).default],
	plugins: [pluginShikiBundle<BundledLanguage, BundledTheme>(shikiOptions)],
	customLoadTheme: (theme) => {
		return loadShikiThemeFromBundle(shikiOptions, theme)
	},
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
