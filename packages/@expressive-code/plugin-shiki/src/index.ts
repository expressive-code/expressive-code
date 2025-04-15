import { ExpressiveCodeLine, ExpressiveCodePlugin, ExpressiveCodeTheme, InlineStyleAnnotation } from '@expressive-code/core'
import type { ThemedToken, ShikiTransformer } from 'shiki'
import { bundledThemes } from 'shiki'
import { ensureLanguagesAreLoaded, ensureThemeIsLoaded, getCachedHighlighter, runHighlighterTask } from './highlighter'
import type { LanguageInput } from './languages'
import { runPreprocessHook, runTokensHook, validateTransformers } from './transformers'

export interface PluginShikiOptions {
	/**
	 * A list of additional languages that should be available for syntax highlighting.
	 *
	 * You can pass any of the language input types supported by Shiki, e.g.:
	 * - `import('./some-exported-grammar.mjs')`
	 * - `async () => JSON.parse(await fs.readFile('some-json-grammar.json', 'utf-8'))`
	 *
	 * See the [Shiki documentation](https://shiki.style/guide/load-lang) for more information.
	 */
	langs?: LanguageInput[] | undefined
	/**
	 * Allows defining alias names for languages. The keys are the alias names,
	 * and the values are the language IDs to which they should resolve.
	 *
	 * The values can either be bundled languages, or additional languages
	 * defined in `langs`.
	 *
	 * @example { 'mjs': 'javascript' }
	 */
	langAlias?: Record<string, string> | undefined
	/**
	 * By default, the additional languages defined in `langs` are only available in
	 * top-level code blocks contained directly in their parent Markdown or MDX document.
	 *
	 * Setting this option to `true` also enables syntax highlighting when a fenced code block
	 * using one of your additional `langs` is nested inside an outer `markdown`, `md` or `mdx`
	 * code block. Example:
	 *
	 * `````md
	 * ````md
	 * This top-level Markdown code block contains a nested `my-custom-lang` code block:
	 *
	 * ```my-custom-lang
	 * This nested code block will only be highlighted using `my-custom-lang`
	 * if `injectLangsIntoNestedCodeBlocks` is enabled.
	 * ```
	 * ````
	 * `````
	 */
	injectLangsIntoNestedCodeBlocks?: boolean | undefined
	/**
	 * An optional list of Shiki transformers.
	 *
	 * **Warning:** This option is experimental and only supports a very limited subset of
	 * transformer features. Currently, only the `preprocess` and `tokens` hooks are supported,
	 * and only if they do not modify the code block's text.
	 *
	 * Trying to use unsupported features will throw an error. For more information, see:
	 *
	 * https://expressive-code.com/key-features/syntax-highlighting/#transformers
	 */
	transformers?: ShikiTransformer[] | unknown[] | undefined
	/**
	 * The RegExp engine to use for syntax highlighting.
	 *
	 * - `'oniguruma'`: The default engine that supports all grammars,
	 *   but requires WebAssembly support.
	 * - `'javascript'`: A pure JavaScript engine that does not require WebAssembly.
	 */
	engine?: 'oniguruma' | 'javascript' | undefined
}

/**
 * A list of all themes bundled with Shiki.
 */
export type BundledShikiTheme = Exclude<keyof typeof bundledThemes, 'css-variables'>

/**
 * A list of all languages bundled with Shiki.
 */
export type { BundledLanguage as BundledShikiLanguage } from 'shiki'

/**
 * Loads a theme bundled with Shiki for use with Expressive Code.
 */
export async function loadShikiTheme(bundledThemeName: BundledShikiTheme) {
	const shikiTheme = (await bundledThemes[bundledThemeName]()).default
	return new ExpressiveCodeTheme(shikiTheme)
}

// Workaround: Shiki exports this as an ambient enum, which throws an error when trying to
// access its values at runtime, so we're defining it ourselves here as a regular enum.
enum FontStyle {
	NotSet = -1,
	None = 0,
	Italic = 1,
	Bold = 2,
	Underline = 4,
	Strikethrough = 8,
}

export function pluginShiki(options: PluginShikiOptions = {}): ExpressiveCodePlugin {
	const { langs, langAlias = {}, injectLangsIntoNestedCodeBlocks, engine } = options

	// Validate all configured transformers
	validateTransformers(options)

	return {
		name: 'Shiki',
		hooks: {
			performSyntaxAnalysis: async ({ codeBlock, styleVariants, config: { logger } }) => {
				const codeLines = codeBlock.getLines()
				let code = codeBlock.code

				// If the code block uses a terminal language and includes placeholder strings
				// in angle brackets (e.g. `<username>`), Shiki will treat the closing `>` as
				// a redirect operator and highlight the character before it differently.
				// We work around this by replacing the brackets around such placeholder strings
				// with different characters that Shiki will not interpret as operators.
				if (isTerminalLanguage(codeBlock.language)) {
					code = code.replace(/<([^>]*[^>\s])>/g, 'X$1X')
				}

				let highlighter
				try {
					highlighter = await getCachedHighlighter({ langs, langAlias, injectLangsIntoNestedCodeBlocks, engine })
				} catch (err) {
					/* c8 ignore next */
					const error = err instanceof Error ? err : new Error(String(err))
					throw new Error(`Failed to load syntax highlighter. Please ensure that the configured langs are supported by Shiki.\nReceived error message: "${error.message}"`, {
						cause: error,
					})
				}

				// Try to load the language if necessary, and log a warning if it's is unknown
				const languageLoadErrors = await ensureLanguagesAreLoaded({ highlighter, langs: [codeBlock.language], langAlias })
				const resolvedLanguage = langAlias[codeBlock.language] ?? codeBlock.language
				const primaryLanguageFailed = languageLoadErrors.failedLanguages.has(resolvedLanguage)
				const embeddedLanguagesFailed = languageLoadErrors.failedEmbeddedLanguages.size > 0
				const loadedLanguageName = primaryLanguageFailed ? 'txt' : resolvedLanguage
				if (primaryLanguageFailed || embeddedLanguagesFailed) {
					const formatLangs = (langs: Set<string> | string[]) =>
						`language${[...langs].length !== 1 ? 's' : ''} ${[...langs]
							.sort()
							.map((lang) => `"${lang}"`)
							.join(', ')}`
					const errorParts = [
						`Error while highlighting code block using ${formatLangs([codeBlock.language])} in ${
							codeBlock.parentDocument?.sourceFilePath ? `document "${codeBlock.parentDocument?.sourceFilePath}"` : 'markdown/MDX document'
						}.`,
					]
					if (primaryLanguageFailed) errorParts.push(`The language could not be found. Using "${loadedLanguageName}" instead.`)
					if (embeddedLanguagesFailed) {
						errorParts.push(`The embedded ${formatLangs(languageLoadErrors.failedEmbeddedLanguages)} could not be found, so highlighting may be incomplete.`)
					}
					errorParts.push('Ensure that all required languages are either part of the bundle or custom languages provided in the "langs" config option.')
					logger.warn(errorParts.join(' '))
				}

				for (let styleVariantIndex = 0; styleVariantIndex < styleVariants.length; styleVariantIndex++) {
					const theme = styleVariants[styleVariantIndex].theme

					// Load theme if necessary
					const loadedThemeName = await ensureThemeIsLoaded(highlighter, theme, styleVariants)

					// Run highlighter (by default, without explanations to improve performance)
					let tokenLines: ThemedToken[][] = []
					try {
						const codeToTokensOptions = {
							lang: loadedLanguageName,
							theme: loadedThemeName,
							includeExplanation: false,
						}

						// Run preprocess hook of all configured transformers
						runPreprocessHook({ options, code, codeBlock, codeToTokensOptions })

						const codeToTokensBase = highlighter.codeToTokensBase
						await runHighlighterTask(() => {
							tokenLines = codeToTokensBase(code, codeToTokensOptions)
						})

						// Run tokens hook of all configured transformers
						tokenLines = runTokensHook({ options, code, codeBlock, codeToTokensOptions, tokenLines })
					} catch (err) {
						/* c8 ignore next */
						const error = err instanceof Error ? err : new Error(String(err))
						throw new Error(`Failed to highlight code block with language "${codeBlock.language}" and theme "${theme.name}".\nReceived error message: "${error.message}"`, {
							cause: error,
						})
					}

					tokenLines.forEach((line, lineIndex) => {
						if (codeBlock.language === 'ansi' && styleVariantIndex === 0) removeAnsiSequencesFromCodeLine(codeLines[lineIndex], line)

						let charIndex = 0
						line.forEach((token) => {
							const tokenLength = token.content.length
							const tokenEndIndex = charIndex + tokenLength
							const fontStyle = token.fontStyle || FontStyle.None
							codeLines[lineIndex]?.addAnnotation(
								new InlineStyleAnnotation({
									styleVariantIndex,
									color: token.color || theme.fg,
									bgColor: token.bgColor,
									italic: ((fontStyle & FontStyle.Italic) as FontStyle) === FontStyle.Italic,
									bold: ((fontStyle & FontStyle.Bold) as FontStyle) === FontStyle.Bold,
									underline: ((fontStyle & FontStyle.Underline) as FontStyle) === FontStyle.Underline,
									strikethrough: ((fontStyle & FontStyle.Strikethrough) as FontStyle) === FontStyle.Strikethrough,
									inlineRange: {
										columnStart: charIndex,
										columnEnd: tokenEndIndex,
									},
									renderPhase: 'earliest',
								})
							)
							charIndex = tokenEndIndex
						})
					})
				}
			},
		},
	}
}

function isTerminalLanguage(language: string) {
	return ['shellscript', 'shell', 'bash', 'sh', 'zsh', 'nu', 'nushell'].includes(language)
}

/**
 * Removes ANSI sequences processed by Shiki from the provided codeline
 */
function removeAnsiSequencesFromCodeLine(codeLine: ExpressiveCodeLine, lineTokens: ThemedToken[]): void {
	// The provided tokens from Shiki will already be stripped for control characters
	const newLine = lineTokens.map((token) => token.content).join('')
	// Removing sequences by ranges instead of whole line to avoid breaking any existing annotations
	const rangesToRemove = getRemovedRanges(codeLine.text, newLine)
	for (let index = rangesToRemove.length - 1; index >= 0; index--) {
		const [start, end] = rangesToRemove[index]
		codeLine.editText(start, end, '')
	}
}

/**
 * Compares a given `original` string to its `edited` version, assuming that the only kind of edits
 * allowed between them is the removal of column ranges from the original string.
 *
 * Returns an array of column ranges that were removed from the original string.
 */
function getRemovedRanges(original: string, edited: string): [start: number, end: number][] {
	const ranges: [start: number, ends: number][] = []
	let from = -1
	let orgIdx = 0
	let edtIdx = 0

	while (orgIdx < original.length && edtIdx < edited.length) {
		if (original[orgIdx] !== edited[edtIdx]) {
			if (from === -1) from = orgIdx
			orgIdx++
		} else {
			if (from > -1) {
				ranges.push([from, orgIdx])
				from = -1
			}
			orgIdx++
			edtIdx++
		}
	}

	if (edtIdx < edited.length) throw new Error(`Edited string contains characters not present in original (${JSON.stringify({ original, edited })})`)

	if (orgIdx < original.length) ranges.push([orgIdx, original.length])

	return ranges
}
