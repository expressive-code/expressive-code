// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { satteri } from '@astrojs/markdown-satteri'
import { astroExpressiveCode } from 'astro-expressive-code'
import { getTestConfig } from '../astro-test-config.mjs'

// https://astro.build/config
export default defineConfig({
	// Astro 6.4 lets us replace the default unified Markdown pipeline with the Sätteri processor.
	// astro-expressive-code should detect this and register its Sätteri HAST plugin instead of rehype.
	markdown: {
		processor: satteri(),
	},
	integrations: [
		astroExpressiveCode({
			// This should get overwritten by the themes specified in `ec.config.mjs`
			themes: ['catppuccin-macchiato', 'catppuccin-latte'],
			// This should get merged with the overrides specified in `ec.config.mjs`
			styleOverrides: {
				textMarkers: {
					// If deep merging works, this customization should be kept
					// as it's not overwritten in `ec.config.mjs`
					lineMarkerAccentWidth: '0.3rem',
					// But this one should get overwritten
					inlineMarkerBorderWidth: '10px',
				},
			},
		}),
		mdx(),
	],
	...getTestConfig(),
})
