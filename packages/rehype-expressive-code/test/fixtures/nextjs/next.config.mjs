// @ts-check
import createMDX from '@next/mdx'
import rehypeExpressiveCode from 'rehype-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

/** @type {import('next').NextConfig} */
const nextConfig = {
	pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
	reactStrictMode: true,
}

/** @type {import('rehype-expressive-code').RehypeExpressiveCodeOptions} */
const rehypeExpressiveCodeOptions = {
	plugins: [pluginCollapsibleSections()],
}

const withMDX = createMDX({
	// Support both .md and .mdx files
	extension: /\.mdx?$/,

	options: {
		remarkPlugins: [],
		rehypePlugins: [[rehypeExpressiveCode, rehypeExpressiveCodeOptions]],
	},
})

// Wrap MDX and Next.js config with each other
export default withMDX(nextConfig)
