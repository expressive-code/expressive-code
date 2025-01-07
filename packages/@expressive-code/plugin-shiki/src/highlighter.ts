import type { StyleVariant } from '@expressive-code/core'
import { ExpressiveCodeTheme, getStableObjectHash } from '@expressive-code/core'
import type { BundledLanguage, HighlighterCore, ThemeRegistration } from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import { bundledLanguages, createHighlighterCore, isSpecialLang } from 'shiki'
import type { LanguageInput, LanguageRegistration, ShikiLanguageRegistration } from './languages'
import { getNestedCodeBlockInjectionLangs } from './languages'
import type { PluginShikiOptions } from '.'

const highlighterPromiseByConfig = new Map<string, Promise<HighlighterCore>>()
// We store theme cache keys by style variant arrays because style variant arrays are unique per engine,
// and we can be confident that the same theme object used by the same engine has the same contents
const themeCacheKeysByStyleVariants = new WeakMap<StyleVariant[], WeakMap<ExpressiveCodeTheme, string>>()

/**
 * Gets a cached Shiki highlighter instance for the given configuration.
 */
export async function getCachedHighlighter(config: PluginShikiOptions = {}): Promise<HighlighterCore> {
	const configCacheKey = getStableObjectHash(config)
	let highlighterPromise = highlighterPromiseByConfig.get(configCacheKey)
	if (highlighterPromise === undefined) {
		highlighterPromise = (async () => {
			const highlighter = await createHighlighterCore({
				themes: [],
				langs: [],
				engine: config.engine === 'javascript' ? createJavaScriptRegexEngine({ forgiving: true }) : createOnigurumaEngine(import('shiki/wasm')),
			})
			// Load any user-provided languages
			await ensureLanguagesAreLoaded({ highlighter, ...config })
			return highlighter
		})()
		highlighterPromiseByConfig.set(configCacheKey, highlighterPromise)
	}
	return highlighterPromise
}

export async function ensureThemeIsLoaded(highlighter: HighlighterCore, theme: ExpressiveCodeTheme, styleVariants: StyleVariant[]) {
	// Unfortunately, Shiki caches themes by name, so we need to ensure that the theme name changes
	// whenever the theme contents change by appending a content hash
	let themeCacheKeys = themeCacheKeysByStyleVariants.get(styleVariants)
	if (!themeCacheKeys) {
		themeCacheKeys = new WeakMap<ExpressiveCodeTheme, string>()
		themeCacheKeysByStyleVariants.set(styleVariants, themeCacheKeys)
	}
	const existingCacheKey = themeCacheKeys.get(theme)
	const cacheKey = existingCacheKey ?? `${theme.name}-${getStableObjectHash({ bg: theme.bg, fg: theme.fg, settings: theme.settings })}`
	if (!existingCacheKey) themeCacheKeys.set(theme, cacheKey)

	await runHighlighterTask(async () => {
		// Only load the theme if it hasn't been loaded yet
		if (highlighter.getLoadedThemes().includes(cacheKey)) return
		const themeUsingCacheKey = { ...theme, name: cacheKey, settings: (theme.settings as ThemeRegistration['settings']) ?? [] }
		await highlighter.loadTheme(themeUsingCacheKey)
	})
	return cacheKey
}

export async function ensureLanguagesAreLoaded(options: Omit<PluginShikiOptions, 'langs'> & { highlighter: HighlighterCore; langs?: (LanguageInput | string)[] | undefined }) {
	const { highlighter, langs = [], langAlias = {}, injectLangsIntoNestedCodeBlocks } = options
	const errors: string[] = []

	if (!langs.length) return errors

	await runHighlighterTask(async () => {
		const loadedLanguages = new Set(highlighter.getLoadedLanguages())
		const handledLanguageNames = new Set<string>()
		const registrations = new Map<string, LanguageRegistration>()

		async function resolveLanguage(language: LanguageInput | string, referencedBy = '') {
			let languageInput: LanguageInput
			// Retrieve the language input of named languages if necessary
			if (typeof language === 'string') {
				// Resolve language aliases
				language = langAlias[language] ?? language
				// Skip if we already handled this language
				if (handledLanguageNames.has(language)) return []
				handledLanguageNames.add(language)
				// Skip if the language doesn't need to be loaded
				if (loadedLanguages.has(language) || isSpecialLang(language)) return []
				// We can't resolve named languages we don't know
				if (!Object.keys(bundledLanguages).includes(language)) {
					errors.push(`Unknown language "${language}"${referencedBy ? `, referenced by language(s): ${referencedBy}` : ''}`)
					return []
				}
				languageInput = bundledLanguages[language as BundledLanguage]
			} else {
				languageInput = language
			}
			// Resolve the language input to an array of language registrations
			const potentialModule = await Promise.resolve(typeof languageInput === 'function' ? languageInput() : languageInput)
			const potentialArray = 'default' in potentialModule ? potentialModule.default : potentialModule
			const languageRegistrations = Array.isArray(potentialArray) ? potentialArray : [potentialArray]
			languageRegistrations.forEach((lang) => {
				if (loadedLanguages.has(lang.name)) return
				// Prevent Shiki from executing its lazy-loading logic
				// as we load any referenced languages ourselves
				const registration = { repository: {}, ...lang, embeddedLangsLazy: [] } as LanguageRegistration
				registrations.set(lang.name, registration)
			})
			// Inject top-level languages into nested code blocks if enabled
			if (injectLangsIntoNestedCodeBlocks && !referencedBy) {
				languageRegistrations.forEach((lang) => {
					const injectionLangs = getNestedCodeBlockInjectionLangs(lang, langAlias)
					injectionLangs.forEach((injectionLang) => registrations.set(injectionLang.name, injectionLang))
				})
			}
			// Recursively resolve referenced languages
			const referencedLangs = [...new Set(languageRegistrations.map((lang) => lang.embeddedLangsLazy ?? []).flat())] as BundledLanguage[]
			const referencers = languageRegistrations.map((lang) => lang.name).join(', ')
			await Promise.all(referencedLangs.map((lang) => resolveLanguage(lang, referencers)))
		}

		await Promise.all(langs.map((lang) => resolveLanguage(lang)))

		if (registrations.size) await highlighter.loadLanguage(...([...registrations.values()] as ShikiLanguageRegistration[]))
	})

	return errors
}

const taskQueue: { taskFn: () => void | Promise<void>; resolve: () => void; reject: (error: unknown) => void }[] = []
let processingQueue = false

/**
 * Runs a task in the mutually exclusive highlighter task queue. Ensuring sequential execution
 * of highlighter operations prevents race conditions caused by lazy-loading of languages.
 */
export function runHighlighterTask(taskFn: () => void | Promise<void>): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		taskQueue.push({ taskFn, resolve, reject })
		if (!processingQueue) {
			processingQueue = true
			processQueue().catch((error) => {
				processingQueue = false
				// eslint-disable-next-line no-console
				console.error('Error in Shiki highlighter task queue:', error)
			})
		}
	})
}

async function processQueue() {
	try {
		while (taskQueue.length > 0) {
			const task = taskQueue.shift()
			if (!task) break
			const { taskFn, resolve, reject } = task
			try {
				await taskFn()
				resolve()
			} catch (error) {
				reject(error)
			}
		}
	} finally {
		processingQueue = false
	}
}
