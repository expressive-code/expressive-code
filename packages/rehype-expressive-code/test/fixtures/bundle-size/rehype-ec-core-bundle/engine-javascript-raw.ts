import { loadShikiThemeFromBundle, rehypeExpressiveCodeCore, RehypeExpressiveCodeCoreOptions, pluginShikiBundle, PluginShikiBundleOptions } from 'rehype-expressive-code'
import { createJavaScriptRawEngine } from 'shiki/engine/javascript'

type BundledLanguage = 'javascript'
type BundledTheme = 'light-plus'

const shikiOptions: PluginShikiBundleOptions<BundledLanguage, BundledTheme> = {
	engine: createJavaScriptRawEngine,
	bundledLangs: {
		javascript: () => import('@shikijs/langs-precompiled/javascript'),
	},
	bundledThemes: {
		'light-plus': () => import('shiki/themes/light-plus.mjs'),
	},
}

const options: RehypeExpressiveCodeCoreOptions<BundledTheme> = {
	themes: [],
	plugins: [pluginShikiBundle<BundledLanguage, BundledTheme>(shikiOptions)],
	customLoadTheme: (theme) => {
		return loadShikiThemeFromBundle(shikiOptions, theme)
	},
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
