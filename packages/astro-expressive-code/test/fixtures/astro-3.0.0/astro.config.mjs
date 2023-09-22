// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { astroExpressiveCode } from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import summerTime from 'summer-time/themes/summer-time-vscode-theme.json'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
	theme: [summerTime, 'solarized-light'],
	plugins: [pluginCollapsibleSections()],
}

// https://astro.build/config
export default defineConfig({
	integrations: [astroExpressiveCode(astroExpressiveCodeOptions), mdx()],
})
