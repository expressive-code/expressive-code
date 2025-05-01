import {
	loadShikiThemeFromHighlighter,
	rehypeExpressiveCodeCore,
	RehypeExpressiveCodeCoreOptions,
	pluginShikiWithHighlighter,
	PluginShikiWithHighlighterOptions,
} from 'rehype-expressive-code'
import { getSingletonHighlighter, BundledLanguage, BundledTheme } from './highlighter'
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
