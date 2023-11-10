/// <reference types="../virtual.d.ts" />
import { APIRoute } from 'astro'
import { styles } from 'virtual:astro-expressive-code/styles'

export const GET: APIRoute = ({ url }) => {
	const match = styles.find(([route]) => url.pathname.endsWith(route))
	if (!match) throw new Error(`No styles found for route ${url.pathname}`)
	return new Response(match[1], { headers: { 'Content-Type': 'text/css', 'Cache-Control': 'public,max-age=31536000,immutable' } })
}
