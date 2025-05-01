import { loadShikiThemeFromBundle, rehypeExpressiveCodeCore, RehypeExpressiveCodeCoreOptions, pluginShikiBundle, PluginShikiBundleOptions } from 'rehype-expressive-code'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import dracula from 'shiki/themes/dracula.mjs'

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
	themes: [dracula],
	plugins: [pluginShikiBundle<BundledLanguage, BundledTheme>(shikiOptions)],
	customLoadTheme: (theme) => {
		return loadShikiThemeFromBundle(shikiOptions, theme)
	},
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
