import { AnnotationRenderOptions, ExpressiveCodeAnnotation, type ExpressiveCodeInlineRange } from './annotation'
import type { TransformAnchorFallback } from './transforms'
import type { Parents } from '../hast'

export type CopyTransformOptions =
	| {
			type: 'removeLine'
	  }
	| {
			type: 'editText'
			inlineRange?: ExpressiveCodeInlineRange | undefined
			newText: string | string[]
	  }
	| {
			type: 'insertLines'
			lines: string[]
			position?: 'before' | 'after' | undefined
			onDeleteLine?: TransformAnchorFallback | undefined
	  }

/**
 * Internal processing annotation used to track copy-only text operations.
 *
 * Instances of this annotation never participate in rendering, but stay attached
 * to their host line and inline range while code edits update annotation ranges.
 */
export class CopyTransformAnnotation extends ExpressiveCodeAnnotation {
	name = 'Copy transform'
	processingOnly = true

	type: CopyTransformOptions['type']
	newText: string | string[] | undefined
	lines: string[] | undefined
	position: 'before' | 'after' | undefined
	onDeleteLine: TransformAnchorFallback | undefined

	constructor(transform: CopyTransformOptions) {
		const isEdit = transform.type === 'editText'
		const isInsert = transform.type === 'insertLines'
		super({ inlineRange: isEdit ? transform.inlineRange : undefined })
		this.type = transform.type
		this.newText = isEdit ? transform.newText : undefined
		this.lines = isInsert ? [...transform.lines] : undefined
		this.position = isInsert ? transform.position : undefined
		this.onDeleteLine = isInsert ? transform.onDeleteLine : undefined
	}

	render({ nodesToTransform }: AnnotationRenderOptions): Parents[] {
		return nodesToTransform
	}
}

export function isCopyTransformAnnotation(value: unknown): value is CopyTransformAnnotation {
	return value instanceof CopyTransformAnnotation || (value as CopyTransformAnnotation | undefined)?.name === 'Copy transform'
}
