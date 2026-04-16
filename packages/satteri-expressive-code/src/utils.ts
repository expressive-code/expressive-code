import type { Element } from 'expressive-code/hast'

export type CodeBlockInfo = NonNullable<ReturnType<typeof getCodeBlockInfo>>

export function getCodeBlockInfo(pre: Element) {
	if (pre.tagName !== 'pre' || pre.children.length !== 1) return
	const code = pre.children[0]
	if (code.type !== 'element' || code.tagName !== 'code') return
	const text = code.children[0]
	if (text.type !== 'text') return
	const data = code.data as { lang?: string; meta?: string } | null | undefined
	return {
		pre,
		code,
		lang: data?.lang ?? '',
		text: text.value,
		meta: data?.meta ?? '',
	}
}
