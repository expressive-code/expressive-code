// @ts-check
import { defineEcConfig, definePlugin } from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { createRequire } from 'node:module'
import testLanguage from './shiki-langs/test-language.mjs'

const require = createRequire(import.meta.url)
const summerTime = require('summer-time/themes/summer-time-vscode-theme.json')

function addStylesPlugin() {
	return definePlugin({
		name: 'Test plugin that conditionally adds group-level styles',
		hooks: {
			preprocessMetadata: ({ codeBlock, addStyles }) => {
				if (codeBlock.metaOptions.getBoolean('addStyles')) {
					addStyles(`
						.frame.has-title .header .title {
							color: orange !important;
						}
					`)
				}
			},
		},
	})
}

export default defineEcConfig({
	themes: [summerTime, 'solarized-light'],
	plugins: [pluginCollapsibleSections(), addStylesPlugin()],
	shiki: {
		langs: [testLanguage],
		injectLangsIntoNestedCodeBlocks: true,
	},
	styleOverrides: {
		textMarkers: {
			inlineMarkerBorderWidth: '3px',
		},
		collapsibleSections: {
			closedBackgroundColor: 'rgb(84 174 255 / 10%)',
		},
	},
})
