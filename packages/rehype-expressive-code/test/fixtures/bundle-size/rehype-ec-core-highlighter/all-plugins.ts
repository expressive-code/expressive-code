import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'
import { pluginFrames } from '@expressive-code/plugin-frames'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { loadShikiThemeFromHighlighter, pluginShikiWithHighlighter, type PluginShikiWithHighlighterOptions } from '@expressive-code/plugin-shiki/core'
import { createHighlighter } from 'shiki'
import type { BundledLanguage, BundledTheme } from 'shiki'

const shikiOptions: PluginShikiWithHighlighterOptions<BundledLanguage, BundledTheme> = {
	highlighter: () => createHighlighter({ langs: [], themes: [] }),
}

const options: RehypeExpressiveCodeCoreOptions<BundledTheme> = {
	themes: [],
	plugins: [pluginShikiWithHighlighter<BundledLanguage, BundledTheme>(shikiOptions), pluginFrames(), pluginTextMarkers()],
	customLoadTheme: (theme) => {
		return loadShikiThemeFromHighlighter(shikiOptions, theme)
	},
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
