import { getCollection } from 'astro:content'
import { OGImageRoute } from 'astro-og-canvas'

const collectionEntries = await getCollection('docs')

// Map the array of content collection entries to create an object.
// Converts [{ id: 'post.md', data: { title: 'Example', description: '' } }]
// to { 'post.md': { title: 'Example', description: '' } }
const pages = Object.fromEntries(collectionEntries.map(({ slug, data }) => [slug, data]))

export const { getStaticPaths, GET } = OGImageRoute({
	param: 'route',
	pages: pages,

	getImageOptions: (_path, page: (typeof pages)[string]) => ({
		title: page.title === 'Expressive Code' ? '' : page.title,
		description: page.description ?? '',
		bgImage: {
			path: `./src/pages/open-graph/_images/background.png`,
		},
		logo: {
			path: './src/pages/open-graph/_images/empty.png',
			size: [200, 175],
		},
		padding: 75,
	}),
})
