// @ts-check
import { definePlugin, ExpressiveCodeAnnotation } from '@expressive-code/core'
import { h } from '@expressive-code/core/hast'

class SquigglesAnnotation extends ExpressiveCodeAnnotation {
	/** @param {import('@expressive-code/core').AnnotationRenderOptions} context */
	render({ nodesToTransform }) {
		return nodesToTransform.map((node) => {
			return h('span.error-squiggles', node)
		})
	}
}

class ErrorMessageAnnotation extends ExpressiveCodeAnnotation {
	/** @param {import('@expressive-code/core').AnnotationRenderOptions} context */
	render({ nodesToTransform }) {
		return nodesToTransform.map((node) => {
			return h('span.error-message', node)
		})
	}
}

export function pluginErrorPreview() {
	return definePlugin({
		name: 'Error Preview',
		baseStyles: `
			.error-squiggles {
				text-decoration-style: wavy;
				text-decoration-color: #f22;
				text-decoration-line: underline;
				& span {
					text-decoration: unset;
				}
			}
			.error-message {
				color: #f22;
				font-style: italic;
				background: #f002;
				padding-inline: 0.4rem;
				border-radius: 0.2rem;
				/* Prevent inline annotations from overriding our styles */
				& span {
					color: inherit;
					font-style: inherit;
				}
			}
		`,
		hooks: {
			preprocessCode: (context) => {
				// Only apply this to code blocks with the `error-preview` meta
				if (!context.codeBlock.meta.includes('error-preview')) return

				context.codeBlock.getLines().forEach((line) => {
					// Find all squiggles markup in the line
					const matches = [...line.text.matchAll(/~~[^~]+~~/g)].reverse()
					matches.forEach((match) => {
						// Add a squiggles annotation to the match
						const from = match.index || 0
						const to = from + match[0].length
						line.addAnnotation(
							new SquigglesAnnotation({
								inlineRange: {
									columnStart: from,
									columnEnd: to,
								},
							})
						)
						// Remove the squiggle markup from the code plaintext
						line.editText(from, to, match[0].slice(2, -2))
					})
				})
			},
			postprocessAnalyzedCode: (context) => {
				// Only apply this to code blocks with the `error-preview` meta
				if (!context.codeBlock.meta.includes('error-preview')) return

				context.codeBlock.getLines().forEach((line) => {
					// Find a `//!` comment surrounded by spaces
					const messageIdx = line.text.match(/(?<=^|\s)\/\/!\s/)?.index
					if (messageIdx !== undefined) {
						// Add an error message annotation to the match
						line.addAnnotation(
							new ErrorMessageAnnotation({
								inlineRange: {
									columnStart: messageIdx,
									columnEnd: line.text.length,
								},
							})
						)
						// Remove the comment markup from the code plaintext
						line.editText(messageIdx, messageIdx + 4, '')
					}
				})
			},
		},
	})
}
