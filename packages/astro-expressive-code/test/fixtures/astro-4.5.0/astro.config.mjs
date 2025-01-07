// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import cloudflare from '@astrojs/cloudflare'
import { astroExpressiveCode } from 'astro-expressive-code'

// https://astro.build/config
export default defineConfig({
	integrations: [
		astroExpressiveCode({
			shiki: {
				engine: 'javascript',
			},
		}),
		mdx(),
		/*
		{
			name: 'trim-shiki',
			hooks: {
				'astro:config:setup': ({ updateConfig }) => {
					updateConfig({
						vite: {
							plugins: [
								{
									name: 'vite-plugin-trim-shiki',
									transform: (code, id) => {
										const allowedAssets = {
											langs: ['astro', 'sass', 'scss', 'stylus', 'less', 'tsx'],
											themes: ['github-dark', 'github-light'],
										}

										const pathRegExp = /\/shiki\/dist\/(langs|themes)\.m?js$/
										const assetType = id.match(pathRegExp)?.[1]
										if (!assetType) return

										const entryRegExp = /(?<=\n)\s*\{[\s\S]*?"id": "(.*?)",[\s\S]*?\n\s*\},?\s*\n/g
										return code.replace(entryRegExp, (match, id) => {
											if (allowedAssets[assetType].includes(id)) return match
											return ''
										})
									},
								},
							],
						},
					})
				},
			},
		},
		*/
	],
	output: 'server',
	adapter: cloudflare(),
})
