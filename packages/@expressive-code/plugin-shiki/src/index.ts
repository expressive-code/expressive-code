import { ExpressiveCodeLine, ExpressiveCodePlugin, ExpressiveCodeTheme, InlineStyleAnnotation } from '@expressive-code/core'
import { type LanguageInput, ensureLanguageIsLoaded, ensureThemeIsLoaded, getCachedHighlighter } from './highlighter'
import { runPreprocessHook, runTokensHook, validateTransformers } from './transformers'
import type { ThemedToken, ShikiTransformer } from 'shiki'
import { bundledThemes } from 'shiki'

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
	transformers?: ShikiTransformer[] | undefined
}

/**
 * A list of all themes bundled with Shiki.
 */
export type BundledShikiTheme = Exclude<keyof typeof bundledThemes, 'css-variables'>

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
}

export function pluginShiki(options: PluginShikiOptions = {}): ExpressiveCodePlugin {
	const { langs } = options

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
					highlighter = await getCachedHighlighter({ langs })
				} catch (err) {
					/* c8 ignore next */
					const error = err instanceof Error ? err : new Error(String(err))
					throw new Error(`Failed to load syntax highlighter. Please ensure that the configured langs are supported by Shiki.\nReceived error message: "${error.message}"`, {
						cause: error,
					})
				}

				// Load language if necessary
				const loadedLanguageName = await ensureLanguageIsLoaded(highlighter, codeBlock.language)
				// If the requested language wasn't available, log a warning
				if (loadedLanguageName !== codeBlock.language) {
					logger.warn(
						`Found unknown code block language "${codeBlock.language}" in ${
							codeBlock.parentDocument?.sourceFilePath ? `document "${codeBlock.parentDocument?.sourceFilePath}"` : 'markdown/MDX document'
						}. Using "${loadedLanguageName}" instead. You can add custom languages using the "langs" config option.`
					)
				}

				for (let styleVariantIndex = 0; styleVariantIndex < styleVariants.length; styleVariantIndex++) {
					const theme = styleVariants[styleVariantIndex].theme

					// Load theme if necessary
					const loadedThemeName = await ensureThemeIsLoaded(highlighter, theme, styleVariants)

					// Run highlighter (by default, without explanations to improve performance)
					let tokenLines: ThemedToken[][]
					try {
						const codeToTokensOptions = {
							lang: loadedLanguageName,
							theme: loadedThemeName,
							includeExplanation: false,
						}

						// Run preprocess hook of all configured transformers
						runPreprocessHook({ options, code, codeBlock, codeToTokensOptions })

						tokenLines = highlighter.codeToTokensBase(
							code,
							// @ts-expect-error: We took care that the language and theme are loaded
							codeToTokensOptions
						)

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
									italic: ((fontStyle & FontStyle.Italic) as FontStyle) === FontStyle.Italic,
									bold: ((fontStyle & FontStyle.Bold) as FontStyle) === FontStyle.Bold,
									underline: ((fontStyle & FontStyle.Underline) as FontStyle) === FontStyle.Underline,
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
