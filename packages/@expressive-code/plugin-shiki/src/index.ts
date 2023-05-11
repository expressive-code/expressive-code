import { ExpressiveCodePlugin, ExpressiveCodeTheme, InlineStyleAnnotation } from '@expressive-code/core'
import { getCachedHighlighter } from './cache'
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
			performSyntaxAnalysis: async ({ codeBlock, theme }) => {
				const highlighter = await getCachedHighlighter({ theme })
				const codeLines = codeBlock.getLines()
				const tokenLines = highlighter.codeToThemedTokens(codeBlock.code, codeBlock.language, theme.name)
				tokenLines.forEach((line, lineIndex) => {
					let charIndex = 0
					line.forEach((token, tokenIndex) => {
						const tokenLength = token.content.length
						const tokenEndIndex = charIndex + tokenLength

						// If Shiki encounters placeholders in angle brackets (e.g. `<username>`)
						// in shell scripts, it will treat the closing angle bracket as a redirect
						// operator and highlight the final character of the placeholder name
						// differently. We detect this and extend the previous token instead.
						const lastTokenWasStringUnquotedArgument =
							tokenIndex > 0 && line[tokenIndex - 1]?.explanation?.slice(-1)[0]?.scopes?.some((scope) => scope.scopeName?.startsWith('string.unquoted.argument.'))
						if (lastTokenWasStringUnquotedArgument) {
							// Check if the current token is a single non-empty character,
							// and the next token is a redirect operator
							const isCharBeforeRedirectOperator = tokenLength === 1 && token.content.trim().length === 1 && containsRedirectOperator(line[tokenIndex + 1])
							// Check if the current token is a two-character combination
							// ending with a redirect operator
							const isCharAndRedirectOperator = tokenLength === 2 && token.content.trim().length === 2 && token.content[1] === '>' && containsRedirectOperator(token)
							if (isCharBeforeRedirectOperator || isCharAndRedirectOperator) {
								// Move the current index forward by 1 character
								// and extend the previous annotation to include it
								charIndex++
								const lastAnnotation = codeLines[lineIndex].getAnnotations().slice(-1)[0]
								if (lastAnnotation && lastAnnotation.inlineRange) {
									lastAnnotation.inlineRange.columnEnd = charIndex
								}
								// Skip processing the current token if there is nothing left
								if (charIndex === tokenEndIndex) return
							}
						}

						// Otherwise, add an annotation for the current token
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

function containsRedirectOperator(token?: IThemedToken) {
	return token?.explanation?.some(
		(part) =>
			// Content must be a single ">"" character
			part.content === '>' &&
			// Scope name must also indicate a redirect operator
			part.scopes?.some((scope) => scope.scopeName?.startsWith('keyword.operator.redirect.'))
	)
}
