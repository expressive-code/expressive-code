import { ExpressiveCodePlugin, InlineStyleAnnotation } from '@expressive-code/core'
import { getCachedHighlighter } from './cache'

export function shiki(): ExpressiveCodePlugin {
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
						codeLines[lineIndex].addAnnotation(
							new InlineStyleAnnotation({
								color: token.color,
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
