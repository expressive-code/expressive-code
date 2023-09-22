import { Highlighter, Theme, getHighlighter } from 'shiki'
import { ExpressiveCodeTheme, getStableObjectHash } from '@expressive-code/core'

let highlighterPromise: Promise<Highlighter> | undefined

const themeCacheKeys = new WeakMap<ExpressiveCodeTheme, string>()

export function getThemeCacheKey(theme: ExpressiveCodeTheme) {
	let key = themeCacheKeys.get(theme)
	if (!key) {
		key = `${theme.name}-${getStableObjectHash({ bg: theme.bg, fg: theme.fg, settings: theme.settings })}`
		themeCacheKeys.set(theme, key)
	}
	return key
}

/**
 * Gets a cached Shiki highlighter instance for the given theme.
 *
 * Unfortunately, Shiki caches themes by name, so we need to ensure that the theme name changes
 * whenever the theme contents change. This is done by using a content-dependent cache key.
 */
export async function getCachedHighlighter({ theme, cacheKey }: { theme: ExpressiveCodeTheme; cacheKey: string }): Promise<Highlighter> {
	const themeUsingCacheKey = { ...theme, name: cacheKey }
	if (highlighterPromise === undefined) {
		highlighterPromise = getHighlighter({ theme: themeUsingCacheKey })
	}
	const highlighter = await highlighterPromise
	if (!highlighter.getLoadedThemes().includes(cacheKey as Theme)) {
		await highlighter.loadTheme(themeUsingCacheKey)
	}
	return highlighter
}
