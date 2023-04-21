import { ExpressiveCodePlugin, InlineStyleAnnotation } from '@expressive-code/core'
import { getCachedHighlighter } from './cache'
import { FontStyle } from 'shiki'

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
