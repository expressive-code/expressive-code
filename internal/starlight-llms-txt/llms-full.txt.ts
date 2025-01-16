import type { APIRoute } from 'astro';
import { generateLlmsTxt } from './generator';

/**
 * Route that generates a single plaintext Markdown document from the full website content.
 */
export const GET: APIRoute = async (context) => {
	const body = await generateLlmsTxt(context, { minify: false });
	return new Response(body);
};
