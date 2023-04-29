import { defineConfig } from 'astro/config'
import remarkExpressiveCode from 'remark-expressive-code'

/** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
const remarkExpressiveCodeOptions = {
	theme: 'solarized-light',
}

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [[remarkExpressiveCode, remarkExpressiveCodeOptions]],
	},
})
