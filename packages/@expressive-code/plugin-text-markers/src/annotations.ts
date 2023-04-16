import { addClass, ExpressiveCodeAnnotation, AnnotationBaseOptions, AnnotationRenderOptions } from '@expressive-code/core'
import { h } from 'hastscript'
import { MarkerType } from './marker-types'

export class TextMarkersLineAnnotation extends ExpressiveCodeAnnotation {
	markerType: MarkerType

	constructor({ markerType, ...baseOptions }: { markerType: MarkerType } & Omit<AnnotationBaseOptions, 'inlineRange'>) {
		super(baseOptions)
		this.markerType = markerType
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => {
			addClass(node, this.markerType)
			return node
		})
	}
}

export class TextMarkersInlineAnnotation extends ExpressiveCodeAnnotation {
	markerType: MarkerType

	constructor({ markerType, ...baseOptions }: { markerType: MarkerType } & NonNullable<Pick<AnnotationBaseOptions, 'inlineRange'>> & Omit<AnnotationBaseOptions, 'inlineRange'>) {
		super(baseOptions)
		this.markerType = markerType
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node, idx) => {
			const transformedNode = h(this.markerType, node)
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
