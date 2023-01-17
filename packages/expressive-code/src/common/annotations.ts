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

export type ColorMapping = { [key: string]: string }

export const ExpressiveCodeDefaultColors: ColorMapping = {
	'mark.background': 'hsl(226, 50%, 33%)',
	'mark.border': 'hsl(224, 50%, 54%)',
	'ins.background': 'hsl(122, 22%, 23%)',
	'ins.border': 'hsl(128, 42%, 38%)',
	'ins.label': 'hsl(128, 31%, 65%)',
	'del.background': 'hsl(338, 40%, 26%)',
	'del.border': 'hsl(338, 46%, 53%)',
	'del.label': 'hsl(338, 36%, 70%)',
}

export function getThemeColor(key: string, customColors?: ColorMapping) {
	return customColors?.[key] || ExpressiveCodeDefaultColors[key]
}
