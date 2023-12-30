// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import starlightLinksValidator from 'starlight-links-validator'

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
							label: 'Themes',
							link: '/guides/themes/',
						},
						{
							label: 'Syntax Highlighting',
							link: '/guides/syntax-highlighting/',
						},
						{
							label: 'Editor & Terminal Frames',
							link: '/guides/frames/',
						},
						{
							label: 'Text & Line Markers',
							link: '/guides/text-markers/',
						},
					],
				},
				{
					label: 'Optional Plugins',
					items: [
						{
							label: 'Collapsible Sections',
							link: '/guides/collapsible-sections/',
						},
					],
				},
				{
					label: 'Customization',
					items: [
						{
							label: 'Overriding Styles',
							link: '/reference/style-overrides/',
						},
						{
							label: 'Developing Plugins',
							link: '/guides/plugins/',
							badge: 'TODO',
						},
					],
				},
				{
					label: 'Reference',
					items: [
						{
							label: 'Configuration Reference',
							link: '/reference/configuration/',
						},
						{
							label: 'Core API',
							link: '/reference/core-api/',
							badge: 'TODO',
						},
						{
							label: 'Plugin API',
							link: '/reference/plugin-api/',
							badge: 'TODO',
						},
						{
							label: 'Plugin Hooks',
							link: '/reference/plugin-hooks/',
							badge: 'TODO',
						},
						{ label: 'Release Notes', link: '/releases/' },
					],
				},
			],
			expressiveCode: {
				plugins: [pluginCollapsibleSections()],
			},
			plugins: [starlightLinksValidator()],
		}),
	],
})
