import { z } from 'zod'

const ExpressiveCodeInlineRange = z.object({
	columnStart: z.number(),
	columnEnd: z.number(),
})

const AnnotationRenderFunction = z.function().args().returns(z.void())

export const ExpressiveCodeAnnotation = z.object({
	name: z.string(),
	inlineRange: ExpressiveCodeInlineRange.optional(),
	render: AnnotationRenderFunction,
})

export type ExpressiveCodeInlineRange = z.infer<typeof ExpressiveCodeInlineRange>

export type AnnotationRenderFunction = z.infer<typeof AnnotationRenderFunction>

export type ExpressiveCodeAnnotation = z.infer<typeof ExpressiveCodeAnnotation>
