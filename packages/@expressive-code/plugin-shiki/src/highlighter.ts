import { Highlighter, ThemeRegistration, bundledLanguages, createHighlighter, isSpecialLang } from 'shiki'
import type { LanguageRegistration as ShikiLanguageRegistration, MaybeGetter, MaybeArray, BundledLanguage } from 'shiki'
import { ExpressiveCodeTheme, getStableObjectHash } from '@expressive-code/core'
import type { StyleVariant } from '@expressive-code/core'
import type { PluginShikiOptions } from '.'

// Unfortunately, the types exported by `vscode-textmate` that are used by Shiki
// don't match the actual grammar requirements & parsing logic in some aspects.
// The types defined here attempt to reduce the amount of incorrect type errors
// that would otherwise occur when importing and adding external grammars.
type IRawRepository = ShikiLanguageRegistration['repository']
export interface LanguageRegistration extends Omit<ShikiLanguageRegistration, 'repository'> {
	repository?: IRawRepository | undefined
}
export type LanguageInput = MaybeGetter<MaybeArray<LanguageRegistration>>

const highlighterPromiseByConfig = new Map<string, Promise<Highlighter>>()
// We store theme cache keys by style variant arrays because style variant arrays are unique per engine,
// and we can be confident that the same theme object used by the same engine has the same contents
const themeCacheKeysByStyleVariants = new WeakMap<StyleVariant[], WeakMap<ExpressiveCodeTheme, string>>()

/**
 * Gets a cached Shiki highlighter instance for the given configuration.
 */
export async function getCachedHighlighter(config: PluginShikiOptions = {}): Promise<Highlighter> {
	const configCacheKey = getStableObjectHash(config)
	let highlighterPromise = highlighterPromiseByConfig.get(configCacheKey)
	if (highlighterPromise === undefined) {
		highlighterPromise = (async () => {
			const highlighter = await createHighlighter({
				themes: [],
				langs: [],
			})
			// Load any user-provided languages
			if (config.langs?.length) await ensureLanguagesAreLoaded(highlighter, config.langs, config.injectLangsIntoNestedCodeBlocks)
			return highlighter
		})()
		highlighterPromiseByConfig.set(configCacheKey, highlighterPromise)
	}
	return highlighterPromise
}

export async function ensureThemeIsLoaded(highlighter: Highlighter, theme: ExpressiveCodeTheme, styleVariants: StyleVariant[]) {
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

export async function ensureLanguagesAreLoaded(highlighter: Highlighter, languages: (LanguageInput | string)[], injectLangsIntoNestedCodeBlocks: boolean = false) {
	const errors: string[] = []

	await runHighlighterTask(async () => {
		const loadedLanguages = new Set(highlighter.getLoadedLanguages())
		const handledLanguageNames = new Set<string>()
		const registrations = new Map<string, ShikiLanguageRegistration>()

		async function resolveLanguage(language: LanguageInput | string, referencedBy = '') {
			let languageInput: LanguageInput
			// Retrieve the language input of named languages from the bundle if necessary
			if (typeof language === 'string') {
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
				const registration = { repository: {}, ...lang, embeddedLangsLazy: [] } as ShikiLanguageRegistration
				registrations.set(lang.name, registration)
			})
			// Inject top-level languages into nested code blocks if enabled
			if (injectLangsIntoNestedCodeBlocks && !referencedBy) {
				languageRegistrations.forEach((lang) => {
					const injectionLangs = getNestedCodeBlockInjectionLangs(lang)
					injectionLangs.forEach((injectionLang) => registrations.set(injectionLang.name, injectionLang))
				})
			}
			// Recursively resolve referenced languages
			const referencedLangs = [...new Set(languageRegistrations.map((lang) => lang.embeddedLangsLazy ?? []).flat())] as BundledLanguage[]
			const referencers = languageRegistrations.map((lang) => lang.name).join(', ')
			await Promise.all(referencedLangs.map((lang) => resolveLanguage(lang, referencers)))
		}

		await Promise.all(languages.map((lang) => resolveLanguage(lang)))

		if (registrations.size) await highlighter.loadLanguage(...registrations.values())
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

function getNestedCodeBlockInjectionLangs(lang: LanguageRegistration) {
	const injectionLangs: ShikiLanguageRegistration[] = []
	const langNameKey = lang.name.replace(/[^a-zA-Z0-9]/g, '_')
	const langNameAndAliases = [lang.name, ...(lang.aliases ?? [])]

	// Create injection language registration for Markdown
	injectionLangs.push({
		name: `${lang.name}-fenced-md`,
		scopeName: `source.${lang.name}.fenced_code_block`,
		injectTo: ['text.html.markdown'],
		injectionSelector: 'L:text.html.markdown',
		patterns: [
			{
				include: `#fenced_code_block_${langNameKey}`,
			},
		],
		repository: {
			[`fenced_code_block_${langNameKey}`]: {
				begin: `(^|\\G)(\\s*)(\`{3,}|~{3,})\\s*(?i:(${langNameAndAliases.join('|')})((\\s+|:|,|\\{|\\?)[^\`]*)?$)`,
				beginCaptures: {
					3: {
						name: 'punctuation.definition.markdown',
					},
					4: {
						name: 'fenced_code.block.language.markdown',
					},
					5: {
						name: 'fenced_code.block.language.attributes.markdown',
					},
				},
				end: '(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$',
				endCaptures: {
					3: {
						name: 'punctuation.definition.markdown',
					},
				},
				name: 'markup.fenced_code.block.markdown',
				patterns: [
					{
						begin: '(^|\\G)(\\s*)(.*)',
						while: '(^|\\G)(?!\\s*([`~]{3,})\\s*$)',
						contentName: `meta.embedded.block.${lang.name}`,
						patterns: [
							{
								include: lang.scopeName,
							},
						],
					},
				],
			},
		},
	})

	// Create injection language registration for MDX
	injectionLangs.push({
		name: `${lang.name}-fenced-mdx`,
		scopeName: `source.${lang.name}.fenced_code_block`,
		injectTo: ['source.mdx'],
		injectionSelector: 'L:source.mdx',
		patterns: [
			{
				include: `#fenced_code_block_${langNameKey}`,
			},
		],
		repository: {
			[`fenced_code_block_${langNameKey}`]: {
				begin: `(?:^|\\G)[\\t ]*(\`{3,})(?:[\\t ]*((?i:(?:.*\\.)?${langNameAndAliases.join('|')}))(?:[\\t ]+((?:[^\\n\\r\`])+))?)(?:[\\t ]*$)`,
				beginCaptures: {
					1: {
						name: 'string.other.begin.code.fenced.mdx',
					},
					2: {
						name: 'entity.name.function.mdx',
						patterns: [
							{
								include: '#markdown-string',
							},
						],
					},
					3: {
						patterns: [
							{
								include: '#markdown-string',
							},
						],
					},
				},
				end: '(?:^|\\G)[\\t ]*(\\1)(?:[\\t ]*$)',
				endCaptures: {
					1: {
						name: 'string.other.end.code.fenced.mdx',
					},
				},
				name: `markup.code.${lang.name}.mdx`,
				patterns: [
					{
						begin: '(^|\\G)(\\s*)(.*)',
						contentName: `meta.embedded.${lang.name}`,
						patterns: [
							{
								include: lang.scopeName,
							},
						],
						while: '(^|\\G)(?![\\t ]*([`~]{3,})[\\t ]*$)',
					},
				],
			},
		},
	})

	return injectionLangs
}
