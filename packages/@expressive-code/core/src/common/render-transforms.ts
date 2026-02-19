import type { Element, Parents } from '../hast'
import { AnnotationRenderOptions, ExpressiveCodeAnnotation } from './annotation'
import type { RenderEmptyLineFn } from './plugin-hooks'
import type { TransformAnchorFallback } from './transforms'
import type { Awaitable, MaybeArray } from '../helpers/types'

export type RenderTransformOptions = {
	type: 'insert'
	position: 'before' | 'after'
	onDeleteLine: TransformAnchorFallback
}

export type RenderTransform = RenderTransformOptions & {
	render: (context: { renderEmptyLine: RenderEmptyLineFn }) => Awaitable<MaybeArray<Element> | null | undefined>
}

/**
 * Internal processing annotation used to track render-only line insertions.
 *
 * Instances of this annotation never participate in normal annotation rendering,
 * but are resolved in a dedicated post-line render pass.
 */
export class RenderTransformAnnotation extends ExpressiveCodeAnnotation {
	name = 'Render transform'
	processingOnly = true

	type: RenderTransformOptions['type']
	position: RenderTransformOptions['position']
	onDeleteLine: RenderTransformOptions['onDeleteLine']
	insertRenderer: RenderTransform['render']

	constructor(transform: RenderTransform) {
		super({})
		this.type = transform.type
		this.position = transform.position
		this.onDeleteLine = transform.onDeleteLine
		this.insertRenderer = transform.render
	}

	render({ nodesToTransform }: AnnotationRenderOptions): Parents[] {
		return nodesToTransform
	}
}

export function isRenderTransformAnnotation(value: unknown): value is RenderTransformAnnotation {
	return value instanceof RenderTransformAnnotation || (value as RenderTransformAnnotation | undefined)?.name === 'Render transform'
}
