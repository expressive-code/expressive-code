import {
	loadShikiThemeFromHighlighter,
	rehypeExpressiveCodeCore,
	RehypeExpressiveCodeCoreOptions,
	pluginShikiWithHighlighter,
	PluginShikiWithHighlighterOptions,
} from 'rehype-expressive-code'
import { getSingletonHighlighter, BundledLanguage, BundledTheme } from './highlighter'

const shikiOptions: PluginShikiWithHighlighterOptions<BundledLanguage, BundledTheme> = {
	highlighter: getSingletonHighlighter,
}

const options: RehypeExpressiveCodeCoreOptions<BundledTheme> = {
	themes: [],
	plugins: [pluginShikiWithHighlighter<BundledLanguage, BundledTheme>(shikiOptions)],
	customLoadTheme: (theme) => {
		return loadShikiThemeFromHighlighter(shikiOptions, theme)
	},
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
