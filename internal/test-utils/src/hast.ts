import { Node, Element, Parent, Root } from 'hast-util-to-html/lib/types'
import { fromHtml } from 'hast-util-from-html'
import { toText, type Options as HastToTextOptions } from 'hast-util-to-text'
import { selectAll } from 'hast-util-select'

export function htmlToHast(html: string): Root {
	return fromHtml(html, { fragment: true })
}

export function hastToText(hast: Node, options?: HastToTextOptions): string {
	return toText(hast, options)
}

export function selectHastElements(selector: string, hast: Parent): Element[] {
	return selectAll(selector, hast)
}
