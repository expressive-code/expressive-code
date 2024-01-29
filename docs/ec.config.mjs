// @ts-check
import { defineEcConfig } from '@astrojs/starlight/expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginFirstWordRed } from './plugins/plugin-first-word-red.js'
import { pluginErrorPreview } from './plugins/plugin-error-preview.js'

export default defineEcConfig({
	plugins: [pluginCollapsibleSections(), pluginFirstWordRed(), pluginErrorPreview()],
})
