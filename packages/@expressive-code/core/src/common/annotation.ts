import { Parent } from 'hast-util-to-html/lib'
import { isFunction, isNumber, isString, newTypeError } from '../internal/type-checks'
import { ExpressiveCodeLine } from './line'

export type ExpressiveCodeInlineRange = {
	columnStart: number
	columnEnd: number
}

export type AnnotationRenderOptions = { nodesToTransform: Parent[]; line: ExpressiveCodeLine }
export type AnnotationRenderFunction = ({ nodesToTransform, line }: AnnotationRenderOptions) => Parent[]

export type AnnotationRenderPhase = 'earliest' | 'earlier' | 'normal' | 'later' | 'latest'

export const AnnotationRenderPhaseOrder: AnnotationRenderPhase[] = ['earliest', 'earlier', 'normal', 'later', 'latest']

export function annotationSortFn(a: ExpressiveCodeAnnotation, b: ExpressiveCodeAnnotation) {
	const indexA = AnnotationRenderPhaseOrder.indexOf(a.renderPhase || 'normal')
	const indexB = AnnotationRenderPhaseOrder.indexOf(b.renderPhase || 'normal')
	return indexA - indexB
}

export type ExpressiveCodeAnnotation = {
	name: string
	inlineRange?: ExpressiveCodeInlineRange
	/**
	 * The function that will be called to render the annotation.
	 *
	 * It will be called with an array of AST nodes to transform, and is expected to return
	 * an array containing the same number of nodes. For example, you could use the `hastscript`
	 * library to wrap the received nodes in HTML elements.
	 */
	render: AnnotationRenderFunction
	/**
	 * Rendering is done in phases, from `earliest` to `latest`.
	 * Annotations with the same phase are rendered in the order they were added.
	 *
	 * The earlier an annotation is rendered, the more likely it is to be split, modified
	 * or wrapped by later annotations. Syntax highlighting is rendered in the `earliest` phase
	 * to allow other annotations to wrap and modify the highlighted code.
	 *
	 * The default phase is `normal`.
	 */
	renderPhase?: AnnotationRenderPhase
}

function validateExpressiveCodeInlineRange(inlineRange: ExpressiveCodeInlineRange) {
	if (!isNumber(inlineRange.columnStart) || !isNumber(inlineRange.columnEnd)) throw newTypeError('ExpressiveCodeInlineRange', inlineRange)
}

function validateAnnotationRenderFunction(renderFunction: AnnotationRenderFunction) {
	if (!isFunction(renderFunction)) throw newTypeError('AnnotationRenderFunction', renderFunction)
}

export function validateExpressiveCodeAnnotation(annotation: ExpressiveCodeAnnotation) {
	try {
		const { name, inlineRange, render } = annotation
		if (!isString(name)) throw newTypeError('string', name)
		if (inlineRange) validateExpressiveCodeInlineRange(inlineRange)
		validateAnnotationRenderFunction(render)
	} catch (error) {
		throw newTypeError('ExpressiveCodeAnnotation', annotation)
	}
}
