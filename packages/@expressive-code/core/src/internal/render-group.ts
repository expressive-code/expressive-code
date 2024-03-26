import type { Element } from '../hast'
import { h } from '../hast'
import { ExpressiveCodeBlock, ExpressiveCodeBlockOptions } from '../common/block'
import { ExpressiveCodePlugin, ResolverContext } from '../common/plugin'
import { ResolvedExpressiveCodeEngineConfig } from '../common/engine'
import { runHooks } from '../common/plugin-hooks'
import { groupWrapperClassName, groupWrapperElement, PluginStyles, processPluginStyles } from './css'
import { renderBlock } from './render-block'
import { isHastElement, newTypeError } from './type-checks'

export type RenderInput = ExpressiveCodeBlockOptions | ExpressiveCodeBlock | (ExpressiveCodeBlockOptions | ExpressiveCodeBlock)[]

export interface RenderOptions {
	/**
	 * An optional handler function that can initialize plugin data for the
	 * code block group before processing starts.
	 *
	 * Plugins can provide access to their data by exporting a const
	 * set to a `new AttachedPluginData(...)` instance (e.g. `myPluginData`).
	 *
	 * You can then import the const and set `onInitGroup` to a function that
	 * calls `myPluginData.setFor(group, { ...data... })`.
	 */
	onInitGroup?: ((groupContents: GroupContents) => void) | undefined
}

export type GroupContents = readonly { codeBlock: ExpressiveCodeBlock }[]

export type RenderedGroupContents = readonly { codeBlock: ExpressiveCodeBlock; renderedBlockAst: Element }[]

export async function renderGroup({
	input,
	options,
	defaultLocale,
	config,
	plugins,
	cssVar,
	cssVarName,
	styleVariants,
}: {
	input: RenderInput
	options?: RenderOptions | undefined
	defaultLocale: string
	config: ResolvedExpressiveCodeEngineConfig
	plugins: readonly ExpressiveCodePlugin[]
} & ResolverContext) {
	// Ensure that the input is an array
	const inputArray = Array.isArray(input) ? input : [input]

	// Validate input array, create ExpressiveCodeBlock instances if necessary,
	// and combine them into a frozen group array that can be passed to plugins
	const groupContents: GroupContents = inputArray.map((blockOrOptions) => {
		if (blockOrOptions instanceof ExpressiveCodeBlock) {
			return { codeBlock: blockOrOptions }
		} else {
			return { codeBlock: new ExpressiveCodeBlock(blockOrOptions) }
		}
	})
	Object.freeze(groupContents)

	// Allow the caller to initialize group data after the group has been created
	options?.onInitGroup?.(groupContents)

	// Render all blocks
	const renderedGroupContents = groupContents as RenderedGroupContents
	const pluginStyles: PluginStyles[] = []
	for (const groupContent of renderedGroupContents) {
		// Render the current block
		const { renderedBlockAst, blockStyles } = await renderBlock({
			codeBlock: groupContent.codeBlock,
			groupContents,
			locale: groupContent.codeBlock.locale || defaultLocale,
			config,
			plugins,
			cssVar,
			cssVarName,
			styleVariants,
		})

		// Store the rendered AST on the group content object
		groupContent.renderedBlockAst = renderedBlockAst

		// Add the returned block styles to the group styles
		pluginStyles.push(...blockStyles)
	}

	// Combine rendered blocks into a group AST
	const groupRenderData = {
		groupAst: buildGroupAstFromRenderedBlocks(renderedGroupContents.map(({ renderedBlockAst }) => renderedBlockAst)),
	}

	// Run postprocessing hooks
	const runHooksContext = {
		plugins,
		config,
	}
	await runHooks('postprocessRenderedBlockGroup', runHooksContext, async ({ hookFn, plugin }) => {
		await hookFn({
			renderedGroupContents,
			pluginStyles: pluginStyles,
			addStyles: (styles: string) => pluginStyles.push({ pluginName: plugin.name, styles }),
			renderData: groupRenderData,
		})
		// The hook may have replaced the group AST though, so ensure it's still valid
		if (!isHastElement(groupRenderData.groupAst)) {
			throw newTypeError('hast Element', groupRenderData.groupAst, 'groupAst')
		}
	})

	return {
		renderedGroupAst: groupRenderData.groupAst,
		renderedGroupContents,
		styles: await processPluginStyles(pluginStyles),
	}
}

/**
 * Creates the group AST wrapper element with a class,
 * allowing us to scope CSS styles that are added by plugins.
 */
function buildGroupAstFromRenderedBlocks(renderedBlocks: Element[]): Element {
	return h(`${groupWrapperElement}.${groupWrapperClassName}`, renderedBlocks)
}
