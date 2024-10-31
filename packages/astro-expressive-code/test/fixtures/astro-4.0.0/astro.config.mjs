// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { astroExpressiveCode } from 'astro-expressive-code'
import testLanguage from './shiki-langs/test-language.mjs'

// https://astro.build/config
export default defineConfig({
	integrations: [
		astroExpressiveCode({
			shiki: {
				// Add a custom `test-language` syntax without built-in support
				// for markdown code blocks - this gets added by the `customMd` language
				// in the `ec.config.mjs` file
				langs: [testLanguage],
			},
		}),
		mdx(),
	],
})
