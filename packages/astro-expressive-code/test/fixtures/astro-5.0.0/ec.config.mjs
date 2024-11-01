// @ts-check
import { defineEcConfig } from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { createRequire } from 'node:module'
import testLanguage from './shiki-langs/test-language.mjs'

const require = createRequire(import.meta.url)
const summerTime = require('summer-time/themes/summer-time-vscode-theme.json')

export default defineEcConfig({
	themes: [summerTime, 'solarized-light'],
	plugins: [pluginCollapsibleSections()],
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
