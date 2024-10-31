// @ts-check
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { createRequire } from 'node:module'
import customMd from './shiki-langs/custom-md.mjs'
const require = createRequire(import.meta.url)
const summerTime = require('summer-time/themes/summer-time-vscode-theme.json')

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
export default {
	themes: [summerTime, 'solarized-light'],
	plugins: [pluginCollapsibleSections()],
	shiki: {
		// This custom markdown language contains definitions for fenced code blocks
		// using our `test-language` syntax, so the custom language test will only pass
		// this array gets merged with the language specified in `astro.config.mjs`
		langs: [customMd],
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
