import { ExpressiveCodePlugin, ExpressiveCodeTheme, InlineStyleAnnotation } from '@expressive-code/core'
import { getCachedHighlighter } from './cache'
import { BUNDLED_THEMES, loadTheme, FontStyle } from 'shiki'

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
			performSyntaxAnalysis: async ({ codeBlock, theme }) => {
				const highlighter = await getCachedHighlighter({ theme })
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

				// Run Shiki on the code (without explanations to improve performance)
				const tokenLines = highlighter.codeToThemedTokens(code, codeBlock.language, theme.name, { includeExplanation: false })
				tokenLines.forEach((line, lineIndex) => {
					let charIndex = 0
					line.forEach((token) => {
						const tokenLength = token.content.length
						const tokenEndIndex = charIndex + tokenLength
						const fontStyle = token.fontStyle || FontStyle.None
						codeLines[lineIndex].addAnnotation(
							new InlineStyleAnnotation({
								color: token.color || theme.fg,
								italic: (fontStyle & FontStyle.Italic) === FontStyle.Italic,
								bold: (fontStyle & FontStyle.Bold) === FontStyle.Bold,
								underline: (fontStyle & FontStyle.Underline) === FontStyle.Underline,
								inlineRange: {
									columnStart: charIndex,
									columnEnd: tokenEndIndex,
								},
							})
						)
						charIndex = tokenEndIndex
					})
				})
			},
		},
	}
}

function isTerminalLanguage(language: string) {
	return ['shellscript', 'shell', 'bash', 'sh', 'zsh'].includes(language)
}
