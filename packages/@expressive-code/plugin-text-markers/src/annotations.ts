import { addClassName, ExpressiveCodeAnnotation, AnnotationBaseOptions, AnnotationRenderOptions } from '@expressive-code/core'
import { h } from 'hastscript'
import { Element } from 'hast-util-select/lib/types'
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
			addClassName(node as Element, this.markerType)
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
