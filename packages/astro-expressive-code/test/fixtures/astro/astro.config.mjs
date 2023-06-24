// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { astroExpressiveCode } from 'astro-expressive-code'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
	theme: 'solarized-light',
}

// https://astro.build/config
export default defineConfig({
	integrations: [astroExpressiveCode(astroExpressiveCodeOptions), mdx()],
})
