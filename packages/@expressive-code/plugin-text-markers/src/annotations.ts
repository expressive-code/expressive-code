import { addClass, ExpressiveCodeAnnotation, AnnotationBaseOptions, AnnotationRenderOptions } from '@expressive-code/core'
import { h } from 'hastscript'
import { MarkerType } from './marker-types'

export class TextMarkerAnnotation extends ExpressiveCodeAnnotation {
	markerType: MarkerType
	backgroundColor: string

	constructor({ markerType, backgroundColor, ...baseOptions }: { markerType: MarkerType; backgroundColor: string } & AnnotationBaseOptions) {
		super(baseOptions)
		this.markerType = markerType
		this.backgroundColor = backgroundColor
	}

	render(options: AnnotationRenderOptions) {
		if (!this.inlineRange) return this.renderFullLineMarker(options)
		return this.renderInlineMarker(options)
	}

	private renderFullLineMarker({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => {
			node.data = node.data || {}
			node.data.textMarkersBackgroundColor = this.backgroundColor
			addClass(node, this.markerType)
			return node
		})
	}

	private renderInlineMarker({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node, idx) => {
			const transformedNode = h(this.markerType, node)
			transformedNode.data = transformedNode.data || {}
			transformedNode.data.textMarkersBackgroundColor = this.backgroundColor

			if (nodesToTransform.length > 0 && idx > 0) {
				addClass(transformedNode, 'open-start')
			}
			if (nodesToTransform.length > 0 && idx < nodesToTransform.length - 1) {
				addClass(transformedNode, 'open-end')
			}
			return transformedNode
		})
	}
}
