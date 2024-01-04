// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightLinksValidator from 'starlight-links-validator'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginFirstWordRed } from './plugins/plugin-first-word-red.js'
import { pluginErrorPreview } from './plugins/plugin-error-preview.js'

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Expressive Code',
			social: {
				github: 'https://github.com/expressive-code/expressive-code',
			},
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'apple-touch-icon',
						href: '/apple-touch-icon.png',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'icon',
						type: 'image/png',
						sizes: '32x32',
						href: '/favicon-32x32.png',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'icon',
						type: 'image/png',
						sizes: '16x16',
						href: '/favicon-16x16.png',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'mask-icon',
						href: '/safari-pinned-tab.svg',
						color: '#603cba',
					},
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Installation', link: '/installation/' },
						{ label: 'Upgrading', link: '/upgrading/' },
						{ label: 'Release History', link: '/releases/' },
					],
				},
				{
					label: 'Key Features',
					items: [
						{
							label: 'Syntax Highlighting',
							link: '/key-features/syntax-highlighting/',
						},
						{
							label: 'Editor & Terminal Frames',
							link: '/key-features/frames/',
						},
						{
							label: 'Text & Line Markers',
							link: '/key-features/text-markers/',
						},
					],
				},
				{
					label: 'Optional Plugins',
					items: [
						{
							label: 'Collapsible Sections',
							link: '/plugins/collapsible-sections/',
						},
					],
				},
				{
					label: 'Customization',
					items: [
						{
							label: 'Themes',
							link: '/guides/themes/',
						},
						{
							label: 'Developing Plugins',
							link: '/guides/developing-plugins/',
						},
					],
				},
				{
					label: 'Reference',
					items: [
						{
							label: 'Configuration Options',
							link: '/reference/configuration/',
						},
						{
							label: 'Style Overrides',
							link: '/reference/style-overrides/',
						},
						{
							label: 'Core API',
							link: '/reference/core-api/',
						},
						{
							label: 'Plugin API',
							link: '/reference/plugin-api/',
						},
						{
							label: 'Plugin Hooks',
							link: '/reference/plugin-hooks/',
						},
					],
				},
			],
			expressiveCode: {
				plugins: [pluginCollapsibleSections(), pluginFirstWordRed(), pluginErrorPreview()],
			},
			plugins: [starlightLinksValidator()],
			customCss: ['./src/styles/custom.css'],
		}),
	],
})
