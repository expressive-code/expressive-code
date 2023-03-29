import { Parent, Element } from 'hast-util-to-html/lib/types'
import { h } from 'hastscript'
import { ExpressiveCodeBlock, ExpressiveCodeBlockOptions } from '../common/block'
import { ExpressiveCodePlugin } from '../common/plugin'
import { runHooks } from '../common/plugin-hooks'
import { ExpressiveCodeTheme } from '../common/theme'
import { groupWrapperClass, groupWrapperElement, PluginStyles, processPluginStyles } from './css'
import { renderBlock } from './render-block'
import { isHastParent, newTypeError } from './type-checks'

export type RenderInput = ExpressiveCodeBlock | ExpressiveCodeBlockOptions | (ExpressiveCodeBlock | ExpressiveCodeBlockOptions)[]

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
	onInitGroup?: (groupContents: GroupContents) => void
}

export type GroupContents = readonly { codeBlock: ExpressiveCodeBlock }[]

export type RenderedGroupContents = readonly { codeBlock: ExpressiveCodeBlock; renderedBlockAst: Element }[]

export async function renderGroup({
	input,
	options,
	theme,
	plugins,
}: {
	input: RenderInput
	options?: RenderOptions
	theme: ExpressiveCodeTheme
	plugins: readonly ExpressiveCodePlugin[]
}) {
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
		const { renderedBlockAst, blockStyles } = renderBlock({
			codeBlock: groupContent.codeBlock,
			groupContents,
			theme,
			plugins,
		})

		// Store the rendered AST on the group content object
		groupContent.renderedBlockAst = renderedBlockAst

		// Add the returned block styles to the group styles
		pluginStyles.push(...blockStyles)
	}

	// Combine rendered blocks into a group AST
	const groupRenderData = {
		groupAst: h(
			null,
			renderedGroupContents.map(({ renderedBlockAst }) => renderedBlockAst)
		),
	}

	runHooks('postprocessRenderedBlockGroup', plugins, ({ hookFn, plugin }) => {
		hookFn({
			renderedGroupContents,
			pluginStyles: pluginStyles,
			addStyles: (styles: string) => pluginStyles.push({ pluginName: plugin.name, styles }),
			renderData: groupRenderData,
		})
		// The hook may have replaced the group AST though, so ensure it's still valid
		if (!isHastParent(groupRenderData.groupAst)) {
			throw newTypeError('hast Parent', groupRenderData.groupAst, 'groupAst')
		}
	})

	return {
		renderedGroupAst: addWrapperAroundGroupAst(groupRenderData.groupAst),
		renderedGroupContents,
		styles: await processPluginStyles(pluginStyles),
	}
}

/**
 * Wraps the group AST in an Expressive Code wrapper element with a class,
 * allowing us to scope CSS styles that are added by plugins.
 */
function addWrapperAroundGroupAst(groupAst: Parent): Parent {
	return h(groupWrapperElement + groupWrapperClass, groupAst)
}
