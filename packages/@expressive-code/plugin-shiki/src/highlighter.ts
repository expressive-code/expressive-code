import type { StyleVariant } from '@expressive-code/core'
import { ExpressiveCodeTheme, getStableObjectHash } from '@expressive-code/core'
import type { BundledLanguage, HighlighterGeneric, ThemeRegistration, LanguageInput as ShikiLanguageInput } from 'shiki'
import { createdBundledHighlighter, isSpecialLang } from 'shiki'
import type { LanguageInput, LanguageRegistration, ShikiLanguageRegistration, LanguageAlias } from './languages'
import { getNestedCodeBlockInjectionLangs } from './languages'
import type { PluginShikiBundleOptions, PluginShikiWithHighlighterOptions } from './core'

export type ShikiHighlighter<L extends string, T extends string> = HighlighterGeneric<L, T>

const highlighterPromiseByConfig = new Map<string, Promise<ShikiHighlighter<string, string>>>()
// We store theme cache keys by style variant arrays because style variant arrays are unique per engine,
// and we can be confident that the same theme object used by the same engine has the same contents
const themeCacheKeysByStyleVariants = new WeakMap<StyleVariant[], WeakMap<ExpressiveCodeTheme, string>>()

export type HighlighterOptions<L extends string, T extends string> = Pick<
	PluginShikiBundleOptions<L, T>,
	'langs' | 'langAlias' | 'injectLangsIntoNestedCodeBlocks' | 'engine' | 'bundledLangs' | 'bundledThemes'
>

/**
 * Gets a cached Shiki highlighter instance for the given configuration.
 */
export async function getCachedHighlighter<L extends string, T extends string>(options: PluginShikiBundleOptions<L, T>): Promise<ShikiHighlighter<L, T>> {
	const { langs, langAlias, injectLangsIntoNestedCodeBlocks, engine, bundledLangs, bundledThemes } = options

	const config: HighlighterOptions<L, T> = {
		langs,
		langAlias,
		injectLangsIntoNestedCodeBlocks,
		engine,
		bundledLangs,
		bundledThemes,
	}
	const configCacheKey = getStableObjectHash(config, { includeFunctionContents: true })
	let highlighterPromise = highlighterPromiseByConfig.get(configCacheKey)
	if (highlighterPromise === undefined) {
		highlighterPromise = (async () => {
			const createHighlighter = createdBundledHighlighter<L, T>({
				langs: bundledLangs as Record<L, ShikiLanguageInput>,
				themes: bundledThemes,
				engine,
			})
			const highlighter = (await createHighlighter({
				langs: [],
				themes: [],
			})) as ShikiHighlighter<string, string>
			// Load any user-provided languages
			await ensureLanguagesAreLoaded({ ...options, highlighter })
			return highlighter
		})()
		highlighterPromiseByConfig.set(configCacheKey, highlighterPromise)
	}
	return highlighterPromise
}

export async function ensureThemeIsLoaded<L extends string, T extends string>(highlighter: ShikiHighlighter<L, T>, theme: ExpressiveCodeTheme, styleVariants: StyleVariant[]) {
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

export async function ensureLanguagesAreLoaded<L extends string, T extends string>(
	options: Omit<PluginShikiWithHighlighterOptions<L, T>, 'langs' | 'highlighter' | 'langAlias'> & {
		highlighter: ShikiHighlighter<L, T>
		langs?: (LanguageInput | string)[] | undefined
		langAlias?: LanguageAlias<L> | undefined
	}
) {
	const { highlighter, langs = [], langAlias = {}, injectLangsIntoNestedCodeBlocks } = options
	const failedLanguages = new Set<string>()
	const failedEmbeddedLanguages = new Set<string>()

	if (!langs.length) return { failedLanguages, failedEmbeddedLanguages }

	await runHighlighterTask(async () => {
		const loadedLanguages = new Set(highlighter.getLoadedLanguages())
		const handledLanguageNames = new Set<string>()
		const registrations = new Map<string, LanguageRegistration>()
		const bundledLanguages = highlighter.getBundledLanguages()

		async function resolveLanguage(language: LanguageInput | string, isEmbedded = false) {
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
					if (isEmbedded) {
						failedEmbeddedLanguages.add(language)
					} else {
						failedLanguages.add(language)
					}
					return []
				}
				languageInput = bundledLanguages[language as L]
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
			if (injectLangsIntoNestedCodeBlocks && !isEmbedded) {
				languageRegistrations.forEach((lang) => {
					const injectionLangs = getNestedCodeBlockInjectionLangs(lang, langAlias)
					injectionLangs.forEach((injectionLang) => registrations.set(injectionLang.name, injectionLang))
				})
			}
			// Recursively resolve embedded languages
			const referencedLangs = [...new Set(languageRegistrations.map((lang) => lang.embeddedLangsLazy ?? []).flat())] as BundledLanguage[]
			await Promise.all(referencedLangs.map((lang) => resolveLanguage(lang, true)))
		}

		await Promise.all(langs.map((lang) => resolveLanguage(lang)))

		if (registrations.size) await highlighter.loadLanguage(...([...registrations.values()] as ShikiLanguageRegistration[]))
	})

	return { failedLanguages, failedEmbeddedLanguages }
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
