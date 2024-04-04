import type { APIRoute } from 'astro'
import { scripts } from 'virtual:astro-expressive-code/scripts'

// Note: As this route is only used in dev mode, there is no need to set a prerender flag

export const GET: APIRoute = ({ url }) => {
	const match = scripts.find(([route]) => url.pathname.endsWith(route))
	if (!match) throw new Error(`No scripts found for route ${url.pathname}`)
	return new Response(match[1], { headers: { 'Content-Type': 'text/javascript', 'Cache-Control': 'public,max-age=31536000,immutable' } })
}
