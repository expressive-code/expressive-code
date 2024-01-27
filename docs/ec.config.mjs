import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginFirstWordRed } from './plugins/plugin-first-word-red.js'
import { pluginErrorPreview } from './plugins/plugin-error-preview.js'

/** @type {import('@astrojs/starlight/expressive-code').AstroExpressiveCodeOptions} */
export default {
	plugins: [pluginCollapsibleSections(), pluginFirstWordRed(), pluginErrorPreview()],
}
