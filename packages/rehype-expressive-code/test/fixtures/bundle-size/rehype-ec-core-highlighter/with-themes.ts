import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'
import { loadShikiThemeFromHighlighter, pluginShikiWithHighlighter, type PluginShikiWithHighlighterOptions } from '@expressive-code/plugin-shiki/core'
import { getSingletonHighlighter, type BundledLanguage, type BundledTheme } from './highlighter'
import dracula from 'shiki/themes/dracula.mjs'

const shikiOptions: PluginShikiWithHighlighterOptions<BundledLanguage, BundledTheme> = {
	highlighter: getSingletonHighlighter,
}

const options: RehypeExpressiveCodeCoreOptions<BundledTheme> = {
	themes: [dracula],
	plugins: [pluginShikiWithHighlighter<BundledLanguage, BundledTheme>(shikiOptions)],
	customLoadTheme: (theme) => {
		return loadShikiThemeFromHighlighter(shikiOptions, theme)
	},
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
