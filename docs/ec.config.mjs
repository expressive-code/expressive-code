// @ts-check
import { defineEcConfig } from '@astrojs/starlight/expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { pluginFirstWordRed } from './plugins/plugin-first-word-red.js'
import { pluginErrorPreview } from './plugins/plugin-error-preview.js'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'

export default defineEcConfig({
	plugins: [pluginCollapsibleSections(), pluginLineNumbers(), pluginFirstWordRed(), pluginErrorPreview()],
	styleOverrides: {
		borderRadius: '0.2rem',
		frames: {
			editorActiveTabIndicatorHeight: '2px',
		},
	},
	shiki: {
		transformers: [transformerColorizedBrackets()],
	},
	defaultProps: {
		showLineNumbers: false,
	},
	inline: 'trailing-curly-colon'
})
