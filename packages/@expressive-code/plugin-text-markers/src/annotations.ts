import { addClassName, ExpressiveCodeAnnotation, AnnotationBaseOptions, AnnotationRenderOptions, setProperty } from '@expressive-code/core'
import { h } from 'hastscript'
import { Element } from 'hast-util-to-html/lib/types'
import { MarkerType } from './marker-types'

export class TextMarkerAnnotation extends ExpressiveCodeAnnotation {
	markerType: MarkerType
	backgroundColor: string
	label: string | undefined

	constructor({ markerType, backgroundColor, label, ...baseOptions }: { markerType: MarkerType; backgroundColor: string; label?: string | undefined } & AnnotationBaseOptions) {
		super(baseOptions)
		this.markerType = markerType
		this.backgroundColor = backgroundColor
		this.label = label
	}

	render(options: AnnotationRenderOptions) {
		if (!this.inlineRange) return this.renderFullLineMarker(options)
		return this.renderInlineMarker(options)
	}

	private renderFullLineMarker({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => {
			addClassName(node as Element, this.markerType)
			if (this.label) {
				setProperty(node as Element, 'data-marker-label', this.label)
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
