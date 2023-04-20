import { defineConfig } from 'astro/config'
import remarkExpressiveCode from 'remark-expressive-code'

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [remarkExpressiveCode],
	},
})
