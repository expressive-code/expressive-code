// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config'
import mdx from '@astrojs/mdx'
import { astroExpressiveCode } from 'astro-expressive-code'

// https://astro.build/config
export default defineConfig({
	base: '/subpath',
	build: {
		assets: '_custom',
	},
	integrations: [astroExpressiveCode(), mdx()],
	image: {
		service: passthroughImageService(),
	},
})
