import { ExpressiveCodeAnnotation, AnnotationBaseOptions, AnnotationRenderOptions } from '@expressive-code/core'
import { addClassName, h, setInlineStyle } from '@expressive-code/core/hast'
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
			if (node.type === 'element') {
				addClassName(node, 'highlight')
				addClassName(node, this.markerType)
				if (this.label) {
					addClassName(node, 'tm-label')
					setInlineStyle(node, '--tmLabel', `'${this.label.replace(/'/g, "\\'")}'`)
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
