import { isFunction, isNumber, isString, newTypeError } from './helpers'

export type ExpressiveCodeInlineRange = {
	columnStart: number
	columnEnd: number
}

export type AnnotationRenderFunction = () => void

export type ExpressiveCodeAnnotation = {
	name: string
	inlineRange?: ExpressiveCodeInlineRange
	render: AnnotationRenderFunction
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
