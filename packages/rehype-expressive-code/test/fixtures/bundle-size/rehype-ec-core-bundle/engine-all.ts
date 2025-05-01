import { loadShikiThemeFromBundle, rehypeExpressiveCodeCore, RehypeExpressiveCodeCoreOptions, pluginShikiBundle, PluginShikiBundleOptions } from 'rehype-expressive-code'
import { createJavaScriptRegexEngine, createOnigurumaEngine } from 'shiki'
import { createJavaScriptRawEngine } from 'shiki/engine/javascript'

type BundledLanguage = 'javascript' | 'typescript'
type BundledTheme = 'light-plus'

const shikiOptions: PluginShikiBundleOptions<BundledLanguage, BundledTheme> = {
	engine: async () => {
		// need something conditional to avoid treeshaking
		switch (new Date().getDay()) {
			case 0:
				return createJavaScriptRegexEngine()
			case 1:
				return createJavaScriptRawEngine()
			default:
				return createOnigurumaEngine()
		}
	},
	bundledLangs: {
		javascript: () => import('shiki/langs/javascript.mjs'),
		typescript: () => import('@shikijs/langs-precompiled/typescript'),
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
