import type { Element } from 'expressive-code/hast'
import type { MdxJsxFlowElementHast, MdxJsxAttribute } from 'mdast-util-mdx-jsx'
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

export function createInlineAssetElement({
	tagName,
	properties = {},
	innerHTML,
	useMdxJsx,
}: {
	tagName: string
	properties?: Record<string, string | null | undefined> | undefined
	innerHTML: string
	useMdxJsx: boolean
}): MdxJsxFlowElementHast | Element {
	if (useMdxJsx) return createMdxJsxElementWithInnerHTML(tagName, properties, innerHTML)
	return {
		type: 'element',
		tagName,
		properties,
		children: [{ type: 'text', value: innerHTML }],
	}
}

function createMdxJsxElementWithInnerHTML(tagName: string, properties: Record<string, MdxJsxAttribute['value']>, innerHTML: string): MdxJsxFlowElementHast {
	const attrs: MdxJsxAttribute[] = Object.entries(properties).map(([name, value]: [string, MdxJsxAttribute['value']]) => ({
		type: 'mdxJsxAttribute',
		name,
		value,
	}))
	return {
		type: 'mdxJsxFlowElement',
		name: tagName,
		attributes: [
			...attrs,
			{
				type: 'mdxJsxAttribute',
				name: 'dangerouslySetInnerHTML',
				value: {
					type: 'mdxJsxAttributeValueExpression',
					value: `{__html:${JSON.stringify(innerHTML)}}`,
					data: {
						estree: {
							type: 'Program',
							body: [
								{
									type: 'ExpressionStatement',
									expression: {
										type: 'ObjectExpression',
										properties: [
											{
												type: 'Property',
												method: false,
												shorthand: false,
												computed: false,
												key: {
													type: 'Identifier',
													name: '__html',
												},
												value: {
													type: 'Literal',
													value: innerHTML,
													raw: JSON.stringify(innerHTML),
												},
												kind: 'init',
											},
										],
									},
								},
							],
							sourceType: 'module',
							comments: [],
						},
					},
				},
			},
		],
		data: {
			_mdxExplicitJsx: true,
		},
		children: [],
	}
}
