import { AnnotationRenderOptions, ExpressiveCodeAnnotation, isInlineStyleAnnotation } from '../common/annotation'
import { ExpressiveCodePlugin } from '../common/plugin'
import { PluginTexts } from '../common/plugin-texts'
import { h } from '../hast'
import tabindexJsModule from './tabindex-js-module.min'

export const coreTexts = new PluginTexts({
	scrollableCodeLabel: 'Scrollable code',
})

coreTexts.addLocale('de', {
	scrollableCodeLabel: 'Scrollbarer Code',
})

export const corePlugins: ExpressiveCodePlugin[] = [
	{
		name: 'Indent wrapper',
		hooks: {
			postprocessAnnotations: ({ codeBlock }) => {
				codeBlock.getLines().forEach((line) => {
					const indent = line.text.match(/^\s+/)?.[0].length ?? 0
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
		hooks: {
			postprocessRenderedBlock: ({ renderData, locale }) => {
				// Provide a localized accessible name that the JS module
				// applies to the `pre` element while the code block is scrollable
				const { blockAst } = renderData
				if (blockAst.tagName !== 'pre') return
				blockAst.properties.dataScrollLabel = coreTexts.get(locale).scrollableCodeLabel
			},
		},
	},
]

class IndentAnnotation extends ExpressiveCodeAnnotation {
	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => h('span.indent', node))
	}
}
