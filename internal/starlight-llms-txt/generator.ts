import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import micromatch from 'micromatch';
import { starlightLllmsTxtContext } from 'virtual:starlight-llms-txt/context';
import { entryToSimpleMarkdown } from './entryToSimpleMarkdown';
import { defaultLang, getSiteTitle, isDefaultLocale } from './utils';

/** Collator to compare two strings in the default language. */
const collator = new Intl.Collator(defaultLang);

/**
 * Generates a single plaintext Markdown document from the full website content.
 */
export async function generateLlmsTxt(
	context: APIContext,
	options: {
		/** Generate a smaller file to fit within smaller context windows. */
		minify: boolean;
	}
): Promise<string> {
	let docs = await getCollection('docs', isDefaultLocale);
	if (options.minify) {
		docs = docs.filter((doc) => !micromatch.isMatch(doc.id, starlightLllmsTxtContext.exclude));
	}
	const { promote, demote } = starlightLllmsTxtContext;
	const prioritizePages = (id: string) => {
		const demoted = demote.findIndex((expr) => micromatch.isMatch(id, expr));
		const promoted = demoted > -1 ? -1 : promote.findIndex((expr) => micromatch.isMatch(id, expr));
		const prefixLength = (promoted > -1 ? promote.length - promoted : 0) + demote.length - demoted - 1;
		return '_'.repeat(prefixLength) + id;
	};
	docs.sort((a, b) => collator.compare(prioritizePages(a.id), prioritizePages(b.id)));
	const segments: string[] = [];
	for (const doc of docs) {
		const docSegments = [`# ${doc.data.hero?.title || doc.data.title}`];
		const description = doc.data.hero?.tagline || doc.data.description;
		if (description) docSegments.push(`> ${description}`);
		docSegments.push(await entryToSimpleMarkdown(doc, context, options.minify));
		segments.push(docSegments.join('\n\n'));
	}
	const preamble = `<SYSTEM>This is the ${
		options.minify ? 'abridged' : 'full'
	} developer documentation for ${getSiteTitle()}</SYSTEM>`;
	return preamble + '\n\n' + segments.join('\n\n');
}
