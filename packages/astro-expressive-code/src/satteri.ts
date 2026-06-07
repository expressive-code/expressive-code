import type { RehypeExpressiveCodeDocument, RehypeExpressiveCodeOptions } from 'rehype-expressive-code'
import { ExpressiveCodeBlock } from 'rehype-expressive-code'
import type { SatteriExpressiveCodeDocument, SatteriExpressiveCodeOptions, SatteriExpressiveCodeRenderer } from 'satteri-expressive-code'
import type { SatteriMarkdownProcessor } from './astro-config'

export async function addSatteriExpressiveCodePlugin(markdownProcessor: SatteriMarkdownProcessor, options: RehypeExpressiveCodeOptions) {
	const { default: satteriExpressiveCode } = await import('satteri-expressive-code')
	markdownProcessor.options.hastPlugins.push(() => satteriExpressiveCode(createSatteriOptions(options))())
}

/**
 * Creates options for the Sätteri plugin based on the given rehype-expressive-code options,
 * allowing Astro users to switch between rehype and Sätteri without EC config changes.
 */
function createSatteriOptions(options: RehypeExpressiveCodeOptions): SatteriExpressiveCodeOptions {
	const { getBlockLocale, customCreateBlock, customCreateRenderer, ...ecOptions } = options
	return {
		...(ecOptions as Omit<SatteriExpressiveCodeOptions, 'getBlockLocale' | 'customCreateBlock' | 'customCreateRenderer'>),
		getBlockLocale: getBlockLocale ? ({ input, document }) => getBlockLocale({ input, file: createSatteriDocumentFile(document) }) : undefined,
		customCreateRenderer: customCreateRenderer ? () => customCreateRenderer(options) as SatteriExpressiveCodeRenderer | Promise<SatteriExpressiveCodeRenderer> : undefined,
		// Sätteri calls HAST plugin factories once per compile, so creating the block factory
		// here keeps the per-document group index state from leaking into later renders
		// that reuse the same Astro Markdown processor.
		customCreateBlock: createSatteriBlockFactory(customCreateBlock),
	}
}

/**
 * Creates a rehype-compatible `file` object from the given Sätteri document.
 * The resulting object includes the Sätteri document under the `data.satteri` key,
 * but also provides `path` and `cwd` properties expected by existing plugins and integrations
 * in the EC ecosystem.
 */
function createSatteriDocumentFile(document: SatteriExpressiveCodeDocument): RehypeExpressiveCodeDocument {
	return {
		path: document.filename,
		cwd: typeof process !== 'undefined' ? process.cwd() : '/',
		data: {
			satteri: document,
		},
	}
}

/**
 * Wraps an optional user `customCreateBlock` so that every code block created by the Sätteri plugin
 * receives a `positionInDocument.groupIndex`. Sätteri visits code blocks without tracking their
 * order within a document, but our renderer uses this index to inject page-wide styles & scripts
 * exactly once per document (before the first block it processes for each source file).
 */
function createSatteriBlockFactory(userCreateBlock: RehypeExpressiveCodeOptions['customCreateBlock']): NonNullable<SatteriExpressiveCodeOptions['customCreateBlock']> {
	const groupIndexByDocument = new Map<string, number>()
	return async ({ input, document }) => {
		const documentKey = input.parentDocument?.sourceFilePath || document.filename || ''
		const groupIndex = groupIndexByDocument.get(documentKey) ?? 0
		groupIndexByDocument.set(documentKey, groupIndex + 1)
		input.parentDocument = { ...input.parentDocument, positionInDocument: { groupIndex } }
		if (userCreateBlock) return userCreateBlock({ input, file: createSatteriDocumentFile(document) })
		return new ExpressiveCodeBlock(input)
	}
}
