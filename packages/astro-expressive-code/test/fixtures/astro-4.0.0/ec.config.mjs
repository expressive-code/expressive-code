import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const summerTime = require('summer-time/themes/summer-time-vscode-theme.json')

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
export default {
	themes: [summerTime, 'solarized-light'],
	plugins: [pluginCollapsibleSections()],
	styleOverrides: {
		textMarkers: {
			lineMarkerAccentWidth: '0.3rem',
		},
		collapsibleSections: {
			closedBackgroundColor: 'rgb(84 174 255 / 10%)',
		},
	},
}
