// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

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
						{ label: 'Welcome', link: '/' },
						{ label: 'Installation', link: '/installation/' },
						{ label: 'Upgrading', link: '/upgrading/' },
						{ label: 'Release History', link: '/releases/' },
					],
				},
				{
					label: 'Core Features',
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
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			expressiveCode: {
				plugins: [pluginCollapsibleSections()],
			},
		}),
	],
})
