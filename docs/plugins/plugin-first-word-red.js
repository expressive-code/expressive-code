// @ts-check
import { InlineStyleAnnotation } from '@expressive-code/core'

/** @returns {import('@expressive-code/core').ExpressiveCodePlugin} */
export function pluginFirstWordRed() {
	return {
		name: 'Make first word red',
		hooks: {
			postprocessAnalyzedCode: (context) => {
				// Only apply this to code blocks with the `first-word-red` meta
				if (!context.codeBlock.meta.includes('first-word-red')) return

				// Get the first line of the code block
				const firstLine = context.codeBlock.getLine(0)
				if (!firstLine) return

				// Find the end of the first word
				const firstWordEnd = firstLine.text.match(/(?<=\w)\W/)?.index ?? -1
				if (firstWordEnd <= 0) return

				// Add an annotation that makes the first word red
				firstLine.addAnnotation(
					new InlineStyleAnnotation({
						inlineRange: {
							columnStart: 0,
							columnEnd: firstWordEnd,
						},
						color: '#ff0000',
						// Only apply the red color to the first configured theme
						styleVariantIndex: 0,
					})
				)
			},
		},
	}
}
