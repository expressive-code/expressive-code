import { definePlugin } from 'rehype-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
	plugins: [pluginCollapsibleSections(), addStylesPlugin()],
}

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

export default astroExpressiveCodeOptions
