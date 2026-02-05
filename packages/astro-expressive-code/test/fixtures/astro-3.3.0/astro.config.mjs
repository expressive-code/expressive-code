// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { astroExpressiveCode } from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import summerTime from 'summer-time/themes/summer-time-vscode-theme.json' with { type: 'json' }
import { getTestConfig } from '../astro-test-config.mjs'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
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

// https://astro.build/config
export default defineConfig({
	integrations: [astroExpressiveCode(astroExpressiveCodeOptions), mdx()],
	...getTestConfig(),
})
