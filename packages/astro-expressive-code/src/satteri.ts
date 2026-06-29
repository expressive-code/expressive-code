import type { HastPluginDefinition, HastVisitorContext, MdxjsEsm } from 'satteri'
import type { Element } from 'rehype-expressive-code/hast'
import type { ExpressiveCodeBlockOptions, RehypeExpressiveCodeDocument, RehypeExpressiveCodeOptions } from 'rehype-expressive-code'
import { fileURLToPath } from 'url-extras'
import { CodeProps } from '../components/types'

type CodeBlockInfo = {
	lang: string
	text: string
	meta: string
}

export function satteriExpressiveCodePlugin(options: RehypeExpressiveCodeOptions): HastPluginDefinition {
	const { tabWidth = 2, getBlockLocale } = options
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

				let normalizedCode = codeBlockInfo.text
				if (tabWidth > 0) normalizedCode = normalizedCode.replace(/\t/g, ' '.repeat(tabWidth))

				const file = createSatteriDocumentFile(ctx)
				const input: ExpressiveCodeBlockOptions = {
					code: normalizedCode,
					language: codeBlockInfo.lang,
					meta: codeBlockInfo.meta,
					parentDocument: {
						sourceFilePath: file.path,
					},
				}
				const locale = await getBlockLocale?.({ input, file })
				const codeProps = {
					code: input.code,
					lang: input.language,
					meta: input.meta,
					locale,
				} satisfies CodeProps

				if (isFirstBlock) {
					ctx.insertBefore(node, {
						type: 'mdxjsEsm',
						value: "import { Code as ExpressiveCodeInternal } from 'astro-expressive-code/components'",
					} as MdxjsEsm)
				}

				return {
					type: 'mdxJsxFlowElement',
					name: 'ExpressiveCodeInternal',
					attributes: Object.entries(codeProps)
						.filter(([_, value]) => value)
						.map(([key, value]) => ({
							type: 'mdxJsxAttribute',
							name: key,
							value,
						})),
					children: [],
				}
			},
		},
	}
}

/**
 * Converts a file URL into a regular filesystem path. Returns undefined for non-file URLs.
 *
 * We use the `url-extras` polyfill instead of `node:url`'s `fileURLToPath()` so that the code
 * keeps working in non-Node environments like Cloudflare.
 */
function getFilePath(fileURL: URL): string | undefined {
	if (fileURL.protocol !== 'file:') {
		return undefined
	}
	return fileURLToPath(fileURL)
}

/**
 * Creates a rehype-compatible `file` object as expected by existing EC plugins,
 * but also includes the original data provided by Sätteri's visitor as `data.satteri`.
 */
function createSatteriDocumentFile(ctx: HastVisitorContext): RehypeExpressiveCodeDocument {
	const fileURL = ctx.fileURL
	const filePath = fileURL ? getFilePath(fileURL) : undefined

	return {
		url: fileURL,
		path: filePath || '',
		cwd: typeof process !== 'undefined' ? process.cwd() : '/',
		data: {
			satteri: {
				source: ctx.source,
				fileURL,
			},
		},
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
