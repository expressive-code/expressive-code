import { defineConfig } from 'astro/config'
import remarkExpressiveCode, { ExpressiveCodeTheme } from 'remark-expressive-code'

/** @type import('remark-expressive-code').RemarkExpressiveCodeOptions */
const remarkExpressiveCodeOptions = {
	theme: new ExpressiveCodeTheme({
		type: 'light',
	}),
}

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [[remarkExpressiveCode, remarkExpressiveCodeOptions]],
	},
})
