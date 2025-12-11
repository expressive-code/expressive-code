import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'
import { loadShikiThemeFromBundle, pluginShikiBundle, type PluginShikiBundleOptions } from '@expressive-code/plugin-shiki/core'
import { createOnigurumaEngine } from 'shiki'

type BundledLanguage = 'javascript'
type BundledTheme = 'light-plus'

const shikiOptions: PluginShikiBundleOptions<BundledLanguage, BundledTheme> = {
	engine: createOnigurumaEngine,
	bundledLangs: {
		javascript: () => import('shiki/langs/javascript.mjs'),
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
