import type { Element, Parents } from 'expressive-code/hast'
import type { MdxJsxFlowElementHast, MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import { getClassNames } from 'expressive-code/hast'
import type { ExpressiveCodeBlockType } from 'expressive-code'
import type { RehypeExpressiveCodeOptions } from './index'

export type CodeBlockInfo = NonNullable<ReturnType<typeof getCodeBlockInfo>>
export type InlineCodeHandler = 'trailing-curly-colon'
export type RehypeExpressiveCodeBlockHandler = (
	node: Element,
	parent: Parents
) =>
	| {
			type: ExpressiveCodeBlockType
			node: Element
			text: string
			lang: string
			meta?: string | undefined
	  }
	| undefined

const getPreCodeBlockInfo: RehypeExpressiveCodeBlockHandler = (pre: Element) => {
	const code = pre.children[0]
	if (!code || code.type !== 'element' || code.tagName !== 'code' || !code.properties) return
	const text = code.children[0]
	if (text.type !== 'text') return
	const langClass = getClassNames(code).find((c) => c.startsWith('language-')) ?? ''
	const lang = langClass.replace('language-', '')
	const meta = (code.data?.meta ?? code.properties?.metastring ?? '') as string
	return {
		type: 'block',
		node: pre,
		text: text.value,
		lang,
		meta,
	}
}

export const InlineCodeHandlers: Record<InlineCodeHandler, RehypeExpressiveCodeBlockHandler> = {
	'trailing-curly-colon': (code, parent) => {
		if (parent.type !== 'element' || parent.tagName === 'pre') return
		const text = code.children[0]
		if (text.type !== 'text') return
		const value = text.value
		if (!value) return
		// find a lang tag. if escaped (immediately preceded by an odd number of backslashes),
		// replace the last backslash with an empty string, unescape the remaining pairs and
		// skip processing. If not escaped, unescape any backslash pairs and process.
		const match = value.match(/(\\*)\{:([\w-]+)\}$/)
		if (!match) return
		const [fullMatch, backslashes, lang] = match
		if (backslashes.length % 2 === 1) {
			// drop the last backslash, then unescape pairs
			const bs = backslashes.slice(0, -1).replace(/\\\\/g, '\\')
			text.value = value.slice(0, match.index) + bs + fullMatch.slice(backslashes.length)
			return
		}

		// unescape any backslash pairs
		const bs = backslashes.length ? backslashes.replace(/\\\\/g, '\\') : ''
		text.value = value.slice(0, match.index) + bs
		return {
			type: 'inline',
			node: code,
			text: text.value,
			lang: lang,
		}
	},
}

export function getCodeBlockInfo(inline: RehypeExpressiveCodeOptions['inline'], node: Element, parent: Parents) {
	if (node.children.length !== 1) return
	if (node.tagName === 'pre') return getPreCodeBlockInfo(node, parent)
	if (node.tagName === 'code' && inline) {
		const handler = InlineCodeHandlers[inline]
		if (!handler) {
			throw new Error(`Unsupported 'inline' value: [${inline}]`)
		}
		return handler(node, parent)
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
