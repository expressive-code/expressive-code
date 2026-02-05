// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { astroExpressiveCode } from 'astro-expressive-code'
import summerTime from 'summer-time/themes/summer-time-vscode-theme.json' with { type: 'json' }
import { getTestConfig } from '../astro-test-config.mjs'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
	themes: [summerTime, 'solarized-light'],
	styleOverrides: {
		textMarkers: {
			lineMarkerAccentWidth: '0.3rem',
		},
		collapsibleSections: {
			closedBackgroundColor: 'rgb(84 174 255 / 10%)',
		},
	},
	emitExternalStylesheet: false,
}

// https://astro.build/config
export default defineConfig({
	integrations: [astroExpressiveCode(astroExpressiveCodeOptions), mdx()],
	...getTestConfig(),
})
