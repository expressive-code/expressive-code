import { Parent, Element } from 'hast-util-to-html/lib/types'
import { h } from 'hastscript'
import { ExpressiveCodeBlock, ExpressiveCodeBlockOptions } from '../common/block'
import { ResolvedCoreStyles } from '../common/core-styles'
import { ExpressiveCodePlugin } from '../common/plugin'
import { runHooks } from '../common/plugin-hooks'
import { ExpressiveCodeTheme } from '../common/theme'
import { groupWrapperClassName, groupWrapperElement, PluginStyles, processPluginStyles } from './css'
import { renderBlock } from './render-block'
import { isHastParent, newTypeError } from './type-checks'

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
	theme,
	defaultLocale,
	coreStyles,
	plugins,
	configClassName,
}: {
	input: RenderInput
	options?: RenderOptions | undefined
	theme: ExpressiveCodeTheme
	defaultLocale: string
	coreStyles: ResolvedCoreStyles
	plugins: readonly ExpressiveCodePlugin[]
	configClassName: string
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
		const { renderedBlockAst, blockStyles } = await renderBlock({
			codeBlock: groupContent.codeBlock,
			groupContents,
			theme,
			locale: groupContent.codeBlock.locale || defaultLocale,
			coreStyles,
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

	await runHooks('postprocessRenderedBlockGroup', plugins, async ({ hookFn, plugin }) => {
		await hookFn({
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
		renderedGroupAst: addWrapperAroundGroupAst({ groupAst: groupRenderData.groupAst, configClassName }),
		renderedGroupContents,
		styles: await processPluginStyles({ pluginStyles, configClassName }),
	}
}

/**
 * Wraps the group AST in an Expressive Code wrapper element with a class,
 * allowing us to scope CSS styles that are added by plugins.
 */
function addWrapperAroundGroupAst({ groupAst, configClassName }: { groupAst: Parent; configClassName: string }): Parent {
	return h(`${groupWrapperElement}.${groupWrapperClassName}.${configClassName}`, groupAst)
}
