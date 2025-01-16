import type { CollectionEntry } from 'astro:content';
import { starlightLllmsTxtContext } from 'virtual:starlight-llms-txt/context';

const { defaultLocale, locales, title } = starlightLllmsTxtContext;
export const defaultLang = (defaultLocale === 'root' ? locales?.root?.lang : defaultLocale) || 'en';

/** Get the site title from the Starlight config. */
export function getSiteTitle(): string {
	return typeof title === 'string' ? title : (title[defaultLang] as string);
}

const localeKeys = Object.keys(locales || {}).filter(
	(key) => key !== 'root' && key !== defaultLang
);
const startsWithLocaleRE = new RegExp(`^(${localeKeys.join('|')})\/`);

/** Check if a content collection entry is part of the default locale or not. */
export function isDefaultLocale(doc: CollectionEntry<'docs'>): boolean {
	return !(localeKeys.includes(doc.id) || startsWithLocaleRE.test(doc.id));
}

/** Append a `/` to the passed string if it doesn’t already end with one. */
export function ensureTrailingSlash(path: string) {
	return path.at(-1) === '/' ? path : path + '/';
}
