import { ExpressiveCodeLine, ExpressiveCodePlugin, ExpressiveCodeTheme, InlineStyleAnnotation } from '@expressive-code/core'
import { type LanguageInput, ensureLanguageIsLoaded, ensureThemeIsLoaded, getCachedHighlighter } from './highlighter'
import { ThemedToken, bundledThemes, ShikiTransformer, ShikiTransformerContextSource } from 'shiki'

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
	 * Whether to include explanations on Shiki tokens.
	 *
	 * Including explanations hurts performance, but might be required by tokens transformers.
	 * Refer to the documentation of transformer(s) you are using.
	 */
	includeExplanation?: boolean | undefined
	/**
	 * List of Shiki transformers
	 *
	 * Currently, only the `preprocess` and `tokens` hooks are supported, and only if they do not modify the underlying text.
	 * If you want to use the `preprocess` or `tokens` hooks of a transformer that has other hooks, you'll need to create a wrapper around it that hides the other hooks.
	 * See the [Shiki documentation](https://shiki.style/guide/transformers) for more information.
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

const unsupportedShikiHooks: (keyof ShikiTransformer)[] = ['code', 'line', 'postprocess', 'pre', 'root', 'span']

export function pluginShiki(options: PluginShikiOptions = {}): ExpressiveCodePlugin {
	const { langs } = options

	// check transformers for unsupported hooks
	if (options.transformers) {
		for (const transformer of options.transformers) {
			const unsupportedHook = unsupportedShikiHooks.find((hook) => transformer[hook] != null)
			if (unsupportedHook) {
				throw new ExpressiveCodeShikiTransformerError(
					`Shiki transformer "${transformer.name}" uses unsupported hook "${unsupportedHook}"\nIf you need to use this transformers other supported hooks, create a wrapper that exposes only the supported hooks.`
				)
			}
		}
	}

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
					const loadedThemeName = await ensureThemeIsLoaded(highlighter, theme)

					// Run highlighter (by default, without explanations to improve performance)
					let tokenLines: ThemedToken[][]
					try {
						const codeToTokensOptions = {
							lang: loadedLanguageName,
							theme: loadedThemeName,
							includeExplanation: options.includeExplanation ?? false,
						}

						const transformerContext: ShikiTransformerContextSource = {
							source: code,
							options: codeToTokensOptions,
							meta: {
								...(Object.fromEntries(codeBlock.metaOptions.list().map((option) => [option.key, option.value])) as Record<string, string | boolean | RegExp>),
								__raw: codeBlock.meta,
							},
							codeToHast: () => {
								throw new ExpressiveCodeShikiTransformerError('`codeToHast` is not supported in tokens transformers')
							},
							codeToTokens: () => {
								throw new ExpressiveCodeShikiTransformerError('`codeToTokens` is not supported in tokens transformers')
							},
						}

						// run preprocess transformers
						if (options.transformers?.length) {
							for (const transformer of options.transformers) {
								const transformedCode = transformer.preprocess?.call(transformerContext, code, codeToTokensOptions)
								if (typeof transformedCode === 'string' && transformedCode !== code) {
									throw new ExpressiveCodeShikiTransformerError(
										`Preprocess transformers that modify code are not supported.\nTransformer "${transformer.name}" attempted to change the code`
									)
								}
							}
						}

						tokenLines = highlighter.codeToTokensBase(
							code,
							// @ts-expect-error: We took care that the language and theme are loaded
							codeToTokensOptions
						)

						// run tokens transformers
						if (options.transformers?.length) {
							for (const transformer of options.transformers) {
								// transformers can either mutate the tokens, or return new tokens
								const transformedTokenLines = transformer.tokens?.call(transformerContext, tokenLines)
								if (transformedTokenLines) {
									tokenLines = transformedTokenLines
								}
							}
						}
					} catch (err) {
						/* c8 ignore next */
						const error = err instanceof Error ? err : new Error(String(err))
						throw new Error(`Shiki failed to highlight code block with language "${codeBlock.language}" and theme "${theme.name}".\nReceived error message: "${error.message}"`, {
							cause: error,
						})
					}

					// if transformers are present, make sure they haven't tried to change the underlying text
					// only do this for the first style variant, since the content should be the same for all style variants
					if (styleVariantIndex === 0 && options.transformers) {
						const numLines = codeBlock.getLines().length
						if (numLines !== tokenLines.length) {
							throw new ExpressiveCodeShikiTransformerError(
								`Tokens transformers that modify text are not supported.\nNumber of lines changed from ${numLines} to ${tokenLines.length}`
							)
						}
						for (let i = 0; i < numLines; i++) {
							const originalText = codeBlock.getLine(i)?.text
							const newText = tokenLines[i].map((token) => token.content).join('')
							if (originalText !== newText) {
								throw new ExpressiveCodeShikiTransformerError(
									`Tokens transformers that modify text are not supported.\nLine ${i + 1} changed from:\n${originalText}\nto:\n${newText}`
								)
							}
						}
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

export class ExpressiveCodeShikiTransformerError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ExpressiveCodeShikiTransformerError'
	}
}
