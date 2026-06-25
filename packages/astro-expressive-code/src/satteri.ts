import type { HastPluginDefinition, HastVisitorContext } from 'satteri'
import type { Element } from 'rehype-expressive-code/hast'
import type { ExpressiveCodeBlockOptions, RehypeExpressiveCodeDocument, RehypeExpressiveCodeOptions, RehypeExpressiveCodeRenderer } from 'rehype-expressive-code'
import { createRenderer, ExpressiveCodeBlock } from 'rehype-expressive-code'

type CodeBlockInfo = {
	lang: string
	text: string
	meta: string
}

export function satteriExpressiveCodePlugin(options: RehypeExpressiveCodeOptions): HastPluginDefinition {
	const { tabWidth = 2, getBlockLocale, customCreateRenderer } = options
	const customCreateBlock = createSatteriBlockFactory(options.customCreateBlock)
	let asyncRenderer: Promise<RehypeExpressiveCodeRenderer> | RehypeExpressiveCodeRenderer | undefined
	let firstBlockClaimed = false

	return {
		name: 'astro-expressive-code-satteri',
		element: {
			filter: ['pre'],
			async visit(node, ctx) {
				const codeBlockInfo = getCodeBlockInfo(node as Element)
				if (!codeBlockInfo) return

				const isFirstBlock = !firstBlockClaimed
				firstBlockClaimed = true

				if (asyncRenderer === undefined) {
					asyncRenderer = (customCreateRenderer ?? createRenderer)(options)
				}
				const { ec, baseStyles, themeStyles, jsModules } = await asyncRenderer

				let normalizedCode = codeBlockInfo.text
				if (tabWidth > 0) normalizedCode = normalizedCode.replace(/\t/g, ' '.repeat(tabWidth))

				const file = createSatteriDocumentFile(ctx)
				const input: ExpressiveCodeBlockOptions = {
					code: normalizedCode,
					language: codeBlockInfo.lang,
					meta: codeBlockInfo.meta,
					parentDocument: {
						sourceFilePath: ctx.fileURL?.href,
					},
				}
				if (getBlockLocale) {
					input.locale = await getBlockLocale({ input, file })
				}

				const codeBlock = await customCreateBlock({ input, file })
				const { renderedGroupAst, styles } = await ec.render(codeBlock)
				const extraElements: Element[] = []
				const stylesToPrepend: string[] = []

				if (isFirstBlock) {
					if (baseStyles) stylesToPrepend.push(baseStyles)
					if (themeStyles) stylesToPrepend.push(themeStyles)
				}
				stylesToPrepend.push(...styles)
				if (stylesToPrepend.length) {
					extraElements.push({
						type: 'element',
						tagName: 'style',
						properties: {},
						children: [{ type: 'text', value: stylesToPrepend.join('') }],
					})
				}
				if (isFirstBlock) {
					jsModules.forEach((moduleCode) => {
						extraElements.push({
							type: 'element',
							tagName: 'script',
							properties: { type: 'module' },
							children: [{ type: 'text', value: moduleCode }],
						})
					})
				}
				if (extraElements.length) {
					const firstChild = renderedGroupAst.children.length > 0 ? renderedGroupAst.children[0] : undefined
					const firstChildIsStyle = firstChild?.type === 'element' && ['style', 'link'].includes(firstChild.tagName)
					const insertIndex = firstChildIsStyle ? 1 : 0
					renderedGroupAst.children.splice(insertIndex, 0, ...extraElements)
				}

				return renderedGroupAst
			},
		},
	}
}

/**
 * Creates a rehype-compatible `file` object as expected by existing EC plugins,
 * but also includes the original data provided by Sätteri's visitor as `data.satteri`.
 */
function createSatteriDocumentFile(ctx: HastVisitorContext): RehypeExpressiveCodeDocument {
	return {
		path: ctx.fileURL?.href || '',
		cwd: typeof process !== 'undefined' ? process.cwd() : '/',
		url: ctx.fileURL,
		data: {
			satteri: {
				source: ctx.source,
				fileURL: ctx.fileURL,
			},
		},
	}
}

/**
 * Wraps an optional user `customCreateBlock` so that every code block created by the Sätteri plugin
 * receives a `positionInDocument.groupIndex`. Sätteri visits code blocks without tracking their
 * order within a document, but our renderer uses this index to inject page-wide styles & scripts
 * exactly once per document (before the first block it processes for each source file).
 */
function createSatteriBlockFactory(userCreateBlock: RehypeExpressiveCodeOptions['customCreateBlock']): NonNullable<RehypeExpressiveCodeOptions['customCreateBlock']> {
	const groupIndexByDocument = new Map<string, number>()
	return async ({ input, file }) => {
		const documentKey = input.parentDocument?.sourceFilePath || file.path || ''
		const groupIndex = groupIndexByDocument.get(documentKey) ?? 0
		groupIndexByDocument.set(documentKey, groupIndex + 1)
		input.parentDocument = { ...input.parentDocument, positionInDocument: { groupIndex } }
		if (userCreateBlock) return userCreateBlock({ input, file })
		return new ExpressiveCodeBlock(input)
	}
}

function getCodeBlockInfo(pre: Element): CodeBlockInfo | undefined {
	if (pre.tagName !== 'pre') return
	const [code, ...rest] = pre.children
	if (rest.length || !code || code.type !== 'element' || code.tagName !== 'code') return
	const [text] = code.children
	if (!text || text.type !== 'text') return
	const data = code.data as { lang?: string; meta?: string } | undefined
	return {
		lang: data?.lang ?? '',
		text: text.value,
		meta: data?.meta ?? '',
	}
}
