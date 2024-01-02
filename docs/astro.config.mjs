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
			sidebar: [
				{
					label: 'Start Here',
					items: [
						{
							label: 'Welcome',
							link: '/',
							badge: 'TODO',
						},
						{ label: 'Installation', link: '/installation/' },
						{ label: 'Upgrading', link: '/upgrading/' },
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
						{ label: 'Release Notes', link: '/releases/' },
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
