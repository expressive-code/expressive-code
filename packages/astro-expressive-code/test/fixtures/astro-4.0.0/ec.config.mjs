import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { createRequire } from 'node:module'
import testLanguage from './shiki-langs/test-language.mjs'
import customMd from './shiki-langs/custom-md.mjs'
const require = createRequire(import.meta.url)
const summerTime = require('summer-time/themes/summer-time-vscode-theme.json')

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
export default {
	themes: [summerTime, 'solarized-light'],
	plugins: [pluginCollapsibleSections()],
	shiki: {
		langs: [customMd, testLanguage],
	},
	styleOverrides: {
		textMarkers: {
			lineMarkerAccentWidth: '0.3rem',
		},
		collapsibleSections: {
			closedBackgroundColor: 'rgb(84 174 255 / 10%)',
		},
	},
}
