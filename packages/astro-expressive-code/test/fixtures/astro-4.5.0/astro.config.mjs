// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config'
import mdx from '@astrojs/mdx'
import cloudflare from '@astrojs/cloudflare'
import { astroExpressiveCode } from 'astro-expressive-code'
import { getTestConfig } from '../astro-test-config.mjs'

// https://astro.build/config
export default defineConfig({
	integrations: [
		astroExpressiveCode({
			shiki: {
				engine: 'javascript',
				bundledLangs: ['astro', 'sass'],
			},
		}),
		mdx(),
	],
	output: 'server',
	adapter: cloudflare(),
	image: {
		service: passthroughImageService(),
	},
	...getTestConfig(),
})
