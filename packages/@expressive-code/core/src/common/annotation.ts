import { Parent } from 'hast-util-to-html/lib/types'
import { isNumber, newTypeError } from '../internal/type-checks'
import { ExpressiveCodeLine } from './line'
import { h } from 'hastscript'

export type ExpressiveCodeInlineRange = {
	columnStart: number
	columnEnd: number
}

// Note: We need to re-export this type to enable VS Code's "auto-implement interface" feature
// in external code using this package.
export type { Parent }
export type AnnotationRenderOptions = { nodesToTransform: Parent[]; line: ExpressiveCodeLine }

export type AnnotationRenderPhase = 'earliest' | 'earlier' | 'normal' | 'later' | 'latest'

/* c8 ignore next */
export const AnnotationRenderPhaseOrder: AnnotationRenderPhase[] = ['earliest', 'earlier', 'normal', 'later', 'latest']

export function annotationSortFn(a: ExpressiveCodeAnnotation, b: ExpressiveCodeAnnotation) {
	const indexA = AnnotationRenderPhaseOrder.indexOf(a.renderPhase || 'normal')
	const indexB = AnnotationRenderPhaseOrder.indexOf(b.renderPhase || 'normal')
	return indexA - indexB
}

export type AnnotationBaseOptions = { inlineRange?: ExpressiveCodeInlineRange; renderPhase?: AnnotationRenderPhase }

export abstract class ExpressiveCodeAnnotation {
	constructor({ inlineRange, renderPhase }: AnnotationBaseOptions) {
		if (inlineRange) validateExpressiveCodeInlineRange(inlineRange)
		this.inlineRange = inlineRange
		this.renderPhase = renderPhase
	}

	/**
	 * Renders the annotation by transforming the provided nodes.
	 *
	 * This function will be called with an array of AST nodes to transform, and is expected
	 * to return an array containing the same number of nodes.
	 *
	 * For example, you could use the `hastscript` library to wrap the received nodes
	 * in HTML elements.
	 */
	abstract render({ nodesToTransform, line }: AnnotationRenderOptions): Parent[]

	/**
	 * An optional range of columns within the line that this annotation applies to.
	 * If not provided, the annotation will apply to the entire line.
	 */
	readonly inlineRange?: ExpressiveCodeInlineRange

	/**
	 * Determines the phase in which this annotation should be rendered.
	 * Rendering is done in phases, from `earliest` to `latest`.
	 * Annotations with the same phase are rendered in the order they were added.
	 *
	 * The earlier an annotation is rendered, the more likely it is to be split, modified
	 * or wrapped by later annotations. Syntax highlighting is rendered in the `earliest` phase
	 * to allow other annotations to wrap and modify the highlighted code.
	 *
	 * The default phase is `normal`.
	 */
	readonly renderPhase?: AnnotationRenderPhase
}

export class InlineStyleAnnotation extends ExpressiveCodeAnnotation {
	color?: string

	constructor({ color, ...baseOptions }: { color?: string } & AnnotationBaseOptions) {
		super(baseOptions)
		this.color = color
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		const tokenStyle = `color:${this.color || 'inherit'}`
		return nodesToTransform.map((node) => {
			const transformedNode = h('span', { style: tokenStyle }, node)
			transformedNode.data = transformedNode.data || {}
			transformedNode.data.inlineStyleColor = this.color
			return transformedNode
		})
	}
}

function validateExpressiveCodeInlineRange(inlineRange: ExpressiveCodeInlineRange) {
	if (!isNumber(inlineRange.columnStart) || !isNumber(inlineRange.columnEnd)) throw newTypeError('ExpressiveCodeInlineRange', inlineRange)
}

export function validateExpressiveCodeAnnotation(annotation: ExpressiveCodeAnnotation) {
	try {
		if (!(annotation instanceof ExpressiveCodeAnnotation)) throw 'Not an ExpressiveCodeAnnotation instance'
		if (annotation.inlineRange) validateExpressiveCodeInlineRange(annotation.inlineRange)
	} catch (error) {
		throw newTypeError('instance of ExpressiveCodeAnnotation', annotation)
	}
}
