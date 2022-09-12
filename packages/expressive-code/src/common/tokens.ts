import type { MarkerType } from './annotations'

export type MarkedRange = {
	markerType: MarkerType
	start: number
	end: number
}

export type SyntaxToken = {
	tokenType: 'syntax'
	color: string
	otherStyles: string
	innerHtml: string
	text: string
	textStart: number
	textEnd: number
}

export type MarkerToken = {
	tokenType: 'marker'
	markerType: MarkerType
	closing?: boolean
}

export type InlineToken = SyntaxToken | MarkerToken

export type InsertionPoint = {
	tokenIndex: number
	innerHtmlOffset: number
}
