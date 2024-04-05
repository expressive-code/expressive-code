import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
export default {
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
