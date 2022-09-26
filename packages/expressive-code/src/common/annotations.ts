export type MarkerType = 'mark' | 'ins' | 'del'

/** When markers overlap, those with higher indices override lower ones. */
export const MarkerTypeOrder: MarkerType[] = ['mark', 'del', 'ins']

export type LineMarkingDefinition = {
	markerType?: MarkerType
	lines: number[]
}

export type InlineMarkingDefinition = {
	markerType?: MarkerType
	text?: string
	regExp?: RegExp
}

export type Annotations = {
	title?: string
	lineMarkings?: LineMarkingDefinition[]
	inlineMarkings?: InlineMarkingDefinition[]
}
