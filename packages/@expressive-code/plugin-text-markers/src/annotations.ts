import { ExpressiveCodeAnnotation, AnnotationBaseOptions, AnnotationRenderOptions } from '@expressive-code/core'
import { addClassName, h, select } from '@expressive-code/core/hast'
import { MarkerType } from './marker-types'

export type TextMarkerCopyCommentSyntax = {
	opening: string
	closing?: string | undefined
}

export class TextMarkerAnnotation extends ExpressiveCodeAnnotation {
	markerType: MarkerType
	backgroundColor: string
	label: string | undefined
	copyCommentSyntax: TextMarkerCopyCommentSyntax | undefined

	constructor({
		markerType,
		backgroundColor,
		label,
		copyCommentSyntax,
		...baseOptions
	}: { markerType: MarkerType; backgroundColor: string; label?: string | undefined; copyCommentSyntax?: TextMarkerCopyCommentSyntax | undefined } & AnnotationBaseOptions) {
		super(baseOptions)
		this.markerType = markerType
		this.backgroundColor = backgroundColor
		this.label = label
		this.copyCommentSyntax = copyCommentSyntax
	}

	render(options: AnnotationRenderOptions) {
		if (!this.inlineRange) return this.renderFullLineMarker(options)
		return this.renderInlineMarker(options)
	}

	private renderFullLineMarker({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => {
			if (node.type === 'element') {
				addClassName(node, 'highlight')
				addClassName(node, this.markerType)
				if (this.label) {
					addClassName(node, 'has-label')
					select('.code', node)?.children.unshift(createLabelHast(this.label))
				}
			}
			return node
		})
	}

	private renderInlineMarker({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node, idx) => {
			const transformedNode = h(this.markerType, node)

			if (nodesToTransform.length > 0 && idx > 0) {
				addClassName(transformedNode, 'open-start')
			}
			if (nodesToTransform.length > 0 && idx < nodesToTransform.length - 1) {
				addClassName(transformedNode, 'open-end')
			}
			return transformedNode
		})
	}
}

export function createLabelHast(input: string | string[]) {
	const lines = Array.isArray(input) ? input : [input]
	const label = normalizeLabelContent(lines) ?? ''
	return h('div.tm-label', label)
}

export function normalizeLabelContent(lines: string[]) {
	if (!lines.length) return undefined
	const label = lines
		.map((line) => line.trim())
		.filter(Boolean)
		.join(' ')
		.trim()
	return label.length > 0 ? label : undefined
}
