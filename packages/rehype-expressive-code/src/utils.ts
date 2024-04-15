import type { Element } from 'expressive-code/hast'
import { getClassNames } from 'expressive-code/hast'

export type CodeBlockInfo = NonNullable<ReturnType<typeof getCodeBlockInfo>>

export function getCodeBlockInfo(pre: Element) {
	if (pre.tagName !== 'pre' || pre.children.length !== 1) return
	const code = pre.children[0]
	if (code.type !== 'element' || code.tagName !== 'code') return
	const text = code.children[0]
	if (text.type !== 'text') return
	const langClass = getClassNames(code).find((c) => c.startsWith('language-')) ?? ''
	const lang = langClass.replace('language-', '')
	const meta = (code.data?.meta ?? code.properties?.metastring ?? '') as string
	return {
		pre,
		code,
		lang,
		text: text.value,
		meta,
	}
}
