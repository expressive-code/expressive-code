import { Highlighter, ThemeRegistration, getHighlighter, isSpecialLang, bundledLanguages } from 'shiki'
import type { LanguageInput as ShikiLanguageInput, LanguageRegistration as ShikiLanguageRegistration, MaybeGetter, MaybeArray, BundledLanguage } from 'shiki'
import { ExpressiveCodeTheme, getStableObjectHash } from '@expressive-code/core'

// Unfortunately, the types exported by `vscode-textmate` that are used by Shiki
// don't match the actual grammar requirements & parsing logic in some aspects.
// The types defined here attempt to reduce the amount of incorrect type errors
// that would otherwise when importing and adding external grammars.
type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>
type IRawRepository = Optional<ShikiLanguageRegistration['repository'], '$self' | '$base'>
export interface LanguageRegistration extends Omit<ShikiLanguageRegistration, 'repository'> {
	repository?: IRawRepository | undefined
}
export type LanguageInput = MaybeGetter<MaybeArray<LanguageRegistration>>

const highlighterPromiseByConfig = new Map<string, Promise<Highlighter>>()
const promisesByHighlighter = new WeakMap<Highlighter, Map<string, Promise<unknown>>>()
const themeCacheKeys = new WeakMap<ExpressiveCodeTheme, string>()

/**
 * Gets a cached Shiki highlighter instance for the given configuration.
 */
export async function getCachedHighlighter(config: { langs?: LanguageInput[] | undefined } = {}): Promise<Highlighter> {
	const configCacheKey = getStableObjectHash(config)
	let highlighterPromise = highlighterPromiseByConfig.get(configCacheKey)
	if (highlighterPromise === undefined) {
		const langs: (ShikiLanguageInput | BundledLanguage)[] = []
		if (config.langs?.length) {
			langs.push(...(config.langs as ShikiLanguageInput[]))
		}
		// For now, always preload all the languages because we had some strange race conditions
		// with lazy-loading that we couldn't solve yet. This is what the old version did as well.
		langs.push(...(Object.keys(bundledLanguages) as BundledLanguage[]))
		highlighterPromise = getHighlighter({
			themes: [],
			langs,
		})
		highlighterPromiseByConfig.set(configCacheKey, highlighterPromise)
	}
	return highlighterPromise
}

export async function ensureThemeIsLoaded(highlighter: Highlighter, theme: ExpressiveCodeTheme) {
	// Unfortunately, Shiki caches themes by name, so we need to ensure that the theme name changes
	// whenever the theme contents change by appending a content hash
	const existingCacheKey = themeCacheKeys.get(theme)
	const cacheKey = existingCacheKey ?? `${theme.name}-${getStableObjectHash({ bg: theme.bg, fg: theme.fg, settings: theme.settings })}`
	if (!existingCacheKey) themeCacheKeys.set(theme, cacheKey)

	// Only load the theme if it hasn't been loaded yet
	if (!highlighter.getLoadedThemes().includes(cacheKey)) {
		// Load the theme or wait for an existing load task to finish
		await memoizeHighlighterTask(highlighter, `loadTheme:${cacheKey}`, () => {
			const themeUsingCacheKey = { ...theme, name: cacheKey, settings: (theme.settings as ThemeRegistration['settings']) ?? [] }
			return highlighter.loadTheme(themeUsingCacheKey)
		})
	}
	return cacheKey
}

export async function ensureLanguageIsLoaded(highlighter: Highlighter, language: string) {
	const loadedLanguages = new Set(highlighter.getLoadedLanguages())
	const isLoaded = loadedLanguages.has(language)
	const isSpecial = isSpecialLang(language)
	const isBundled = Object.keys(bundledLanguages).includes(language)
	// If the language is not available, fall back to "txt"
	const isAvailable = isLoaded || isSpecial || isBundled
	if (!isAvailable) return 'txt'
	if (isLoaded || isSpecial) return language
	// Load the language or wait for an existing load task to finish
	const loadedLanguage = await memoizeHighlighterTask(highlighter, `loadLanguage:${language}`, async () => {
		await highlighter.loadLanguage(language as BundledLanguage)
		return language
	})
	return loadedLanguage
}

/**
 * Memoizes a task by ID for a given highlighter instance.
 *
 * This is necessary because SSGs can process multiple pages in parallel and we don't want to
 * start the same async task multiple times, but instead return the same promise for all calls
 * to improve performance and reduce memory usage.
 */
function memoizeHighlighterTask<T>(highlighter: Highlighter, taskId: string, taskFn: () => Promise<T>) {
	let promises = promisesByHighlighter.get(highlighter)
	if (!promises) {
		promises = new Map()
		promisesByHighlighter.set(highlighter, promises)
	}
	let promise = promises.get(taskId)
	if (promise === undefined) {
		promise = taskFn()
		promises.set(taskId, promise)
	}
	return promise as Promise<T>
}
