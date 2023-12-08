import { ExpressiveCodeLine, ExpressiveCodePlugin, ExpressiveCodeTheme, InlineStyleAnnotation } from '@expressive-code/core'
import { getCachedHighlighter, getThemeCacheKey } from './cache'
import { BUNDLED_THEMES, loadTheme, FontStyle, IThemedToken } from 'shiki'

/**
 * A list of all themes bundled with Shiki.
 */
export type BundledShikiTheme = Exclude<(typeof BUNDLED_THEMES)[number], 'css-variables'>

/**
 * Loads a theme bundled with Shiki for use with Expressive Code.
 *
 * If the given theme name is not a bundled theme, it will be treated as a path to a theme file.
 */
export async function loadShikiTheme(bundledThemeName: BundledShikiTheme) {
	const shikiTheme = await loadTheme(BUNDLED_THEMES.includes(bundledThemeName) ? `themes/${bundledThemeName}.json` : bundledThemeName)

	// Unfortunately, some of the themes bundled with Shiki have an undefined theme type,
	// and Shiki always defaults to 'dark' in this case, leading to incorrect UI colors.
	// To fix this, we remove the type property here, which causes the ExpressiveCodeTheme
	// constructor to autodetect the correct type.
	const shikiThemeWithoutType: Partial<typeof shikiTheme> = { ...shikiTheme }
	delete shikiThemeWithoutType.type

	return new ExpressiveCodeTheme(shikiThemeWithoutType)
}

export function pluginShiki(): ExpressiveCodePlugin {
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

				for (let styleVariantIndex = 0; styleVariantIndex < styleVariants.length; styleVariantIndex++) {
					const theme = styleVariants[styleVariantIndex].theme
					const cacheKey = getThemeCacheKey(theme)
					const highlighter = await getCachedHighlighter({ theme, cacheKey })

					// Run Shiki on the code
					let tokenLines: IThemedToken[][] | undefined
					if (codeBlock.language === 'ansi') {
						// Run ANSI highlighter
						tokenLines = highlighter.ansiToThemedTokens(code, cacheKey)
					} else {
						// Check if the language is supported by Shiki
						const loadedLanguages = highlighter.getLoadedLanguages().map((lang) => lang.toString())
						const highlighterLanguage = loadedLanguages.includes(codeBlock.language) ? codeBlock.language : 'txt'
						if (highlighterLanguage !== codeBlock.language && styleVariantIndex === 0) {
							logger.warn(
								`Found unknown code block language "${codeBlock.language}" in ${
									codeBlock.parentDocument?.sourceFilePath ? `document "${codeBlock.parentDocument?.sourceFilePath}"` : 'markdown/MDX document'
								}. Using "${highlighterLanguage}" instead.`
							)
						}
						// Run regular highlighter (without explanations to improve performance)
						tokenLines = highlighter.codeToThemedTokens(code, highlighterLanguage, cacheKey, { includeExplanation: false })
					}

					tokenLines.forEach((line, lineIndex) => {
						if (codeBlock.language === 'ansi' && styleVariantIndex === 0) removeAnsiSequencesFromCodeLine(codeLines[lineIndex], line)

						let charIndex = 0
						line.forEach((token) => {
							const tokenLength = token.content.length
							const tokenEndIndex = charIndex + tokenLength
							const fontStyle = token.fontStyle || FontStyle.None
							codeLines[lineIndex].addAnnotation(
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
	return ['shellscript', 'shell', 'bash', 'sh', 'zsh'].includes(language)
}

/**
 * Removes ANSI sequences processed by Shiki from the provided codeline
 */
function removeAnsiSequencesFromCodeLine(codeLine: ExpressiveCodeLine, lineTokens: IThemedToken[]): void {
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
