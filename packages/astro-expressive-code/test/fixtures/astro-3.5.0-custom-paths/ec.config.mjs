import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import summerTime from 'summer-time/themes/summer-time-vscode-theme.json'

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

export default astroExpressiveCodeOptions
