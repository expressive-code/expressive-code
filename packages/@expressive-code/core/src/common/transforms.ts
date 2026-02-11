import type { ExpressiveCodeInlineRange } from './annotation'
import type { ExpressiveCodeLine } from './line'

export type TransformAnchorFallback = 'stick-prev' | 'stick-next' | 'drop'

export type TransformTarget = {
	line: ExpressiveCodeLine
	lineIndex: number
	inlineRange?: ExpressiveCodeInlineRange | undefined
}
