export interface ExpressiveCodeAnnotation {
	name: string
	inlineRange?: ExpressiveCodeInlineRange
	render: AnnotationRenderFunction
}

export type AnnotationRenderFunction = () => void

export interface ExpressiveCodeInlineRange {
	columnStart: number
	columnEnd: number
}
