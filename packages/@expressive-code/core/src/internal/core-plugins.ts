import { AnnotationRenderOptions, ExpressiveCodeAnnotation, isInlineStyleAnnotation } from '../common/annotation'
import { ExpressiveCodePlugin } from '../common/plugin'
import { h } from '../hast'
import { getLeadingWhitespaceColumns } from './indentation'
import tabindexJsModule from './tabindex-js-module.min'

export const corePlugins: ExpressiveCodePlugin[] = [
	{
		name: 'Indent wrapper',
		hooks: {
			postprocessAnnotations: ({ codeBlock }) => {
				codeBlock.getLines().forEach((line) => {
					const indent = getLeadingWhitespaceColumns(line.text)
					if (indent > 0) {
						// Remove any unnecessary inline styles inside the indent
						line.getAnnotations().forEach((annotation) => {
							const { inlineRange } = annotation
							if (!inlineRange || !isInlineStyleAnnotation(annotation)) return
							if (inlineRange.columnStart >= 0 && inlineRange?.columnEnd <= indent) {
								line.deleteAnnotation(annotation)
							}
						})
						// Add an annotation to the indent to prevent wrapping
						line.addAnnotation(
							new IndentAnnotation({
								inlineRange: { columnStart: 0, columnEnd: indent },
								renderPhase: 'earlier',
							})
						)
					}
				})
			},
		},
	},
	{
		name: 'Scrollable block tabindex',
		jsModules: [tabindexJsModule],
	},
]

class IndentAnnotation extends ExpressiveCodeAnnotation {
	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => h('span.indent', node))
	}
}
