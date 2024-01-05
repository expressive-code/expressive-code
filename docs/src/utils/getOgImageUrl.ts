/**
 * Get the path to the OpenGraph image for a page
 */
export function getOgImageUrl(path: string): string | undefined {
	const imagePath = path.replace(/^\//, '').replace(/\/$/, '').replace(/^$/, 'index') + '.png'
	return '/open-graph/' + imagePath
}
