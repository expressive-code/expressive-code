import { ExpressiveCodeBlock, ExpressiveCodeBlockGroup, ExpressiveCodeBlockOptions } from './block'
import { isBoolean, isHastElement, isHastParent, newTypeError } from '../internal/type-checks'
import { ExpressiveCodePlugin, ExpressiveCodePluginHooks, ExpressiveCodePluginHooks_BeforeRendering } from './plugin'
import { buildCodeBlockAstFromRenderedLines, buildGroupAstFromRenderedBlocks, renderLineToAst } from '../internal/rendering'

export interface ExpressiveCodeConfig {
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins: ExpressiveCodePlugin[]
}

export type ExpressiveCodeProcessingInput = ExpressiveCodeBlock | ExpressiveCodeBlockOptions | (ExpressiveCodeBlock | ExpressiveCodeBlockOptions)[]

export interface ExpressiveCodeProcessingOptions {
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
	onInitGroup?: (group: ExpressiveCodeBlockGroup) => void
}

export class ExpressiveCode {
	constructor(config: ExpressiveCodeConfig) {
		this.#config = config
	}

	process(input: ExpressiveCodeProcessingInput, options?: ExpressiveCodeProcessingOptions) {
		// Ensure that the input is an array
		const inputArray = Array.isArray(input) ? input : [input]

		// Validate input array, create ExpressiveCodeBlock instances if necessary,
		// and combine them into a frozen group array that can be passed to plugins
		const group = inputArray.map((blockOrOptions) => {
			if (blockOrOptions instanceof ExpressiveCodeBlock) {
				return blockOrOptions
			} else {
				return new ExpressiveCodeBlock(blockOrOptions)
			}
		})
		Object.freeze(group)

		// Allow the caller to initialize group data after the group has been created
		options?.onInitGroup?.(group)

		// Render all blocks
		const renderedBlocks = group.map((codeBlock) => {
			// Process the block and return it along with the scoped plugin data
			// and the rendered AST
			return {
				codeBlock,
				blockAst: this.#processSingleBlock(codeBlock, group),
			}
		})

		// Combine rendered blocks into a group AST
		const groupRenderData = {
			groupAst: buildGroupAstFromRenderedBlocks(renderedBlocks.map((renderedBlock) => renderedBlock.blockAst)),
		}
		this.#getHooks('postprocessRenderedBlockGroup').forEach(({ hookFn, plugin }) => {
			hookFn({
				groupContents: renderedBlocks.map(({ codeBlock, blockAst }) => ({
					codeBlock,
					group,
					// At this point, we don't want plugins to be able to replace the
					// individual block AST objects because they are referenced as children
					// inside the group AST, so we freeze the object
					renderData: Object.freeze({ blockAst }),
				})),
				renderData: groupRenderData,
			})
			// The hook may have replaced the group AST though, so ensure it's still valid
			if (!isHastParent(groupRenderData.groupAst)) {
				throw new Error(
					`Plugin ${plugin.name} set groupAst to an invalid value in its postprocessRenderedBlockGroup hook. ` +
						`Expected a valid hast Root, but got ${JSON.stringify(groupRenderData.groupAst)} instead.`
				)
			}
		})

		return {
			renderedAst: groupRenderData.groupAst,
			groupContents: renderedBlocks.map(({ codeBlock, blockAst }) => ({
				codeBlock,
				blockAst,
			})),
		}
	}

	#processSingleBlock(codeBlock: ExpressiveCodeBlock, group: ExpressiveCodeBlockGroup) {
		const state: ExpressiveCodeProcessingState = {
			canEditAnnotations: true,
			canEditCode: true,
			canEditMetadata: true,
		}
		codeBlock.state = state

		const runHooks = (key: keyof ExpressiveCodePluginHooks_BeforeRendering) => {
			this.#getHooks(key).forEach(({ hookFn }) => {
				hookFn({ codeBlock, group })
			})
		}

		// Run hooks for preprocessing metadata and code
		state.canEditCode = false
		runHooks('preprocessMetadata')
		state.canEditCode = true
		runHooks('preprocessCode')

		// Run hooks for processing & finalizing the code
		runHooks('performSyntaxAnalysis')
		runHooks('postprocessAnalyzedCode')
		state.canEditCode = false

		// Run hooks for annotating the code
		runHooks('annotateCode')
		runHooks('postprocessAnnotations')
		state.canEditMetadata = false
		state.canEditAnnotations = false

		// Render lines to AST and run rendering hooks
		const lines = codeBlock.getLines()
		const renderedAstLines = lines.map((line, lineIndex) => {
			// Render the current line to an AST and wrap it in an object that can be passed
			// through all hooks, allowing plugins to edit or completely replace the AST
			const lineRenderData = {
				lineAst: renderLineToAst(line),
			}
			// Allow plugins to modify or even completely replace the AST
			this.#getHooks('postprocessRenderedLine').forEach(({ hookFn, plugin }) => {
				hookFn({ codeBlock, group, line, lineIndex, renderData: lineRenderData })
				if (!isHastElement(lineRenderData.lineAst)) {
					throw new Error(
						`Plugin ${plugin.name} set lineAst to an invalid value in its postprocessRenderedLine hook. ` +
							`Expected a valid hast Element, but got ${JSON.stringify(lineRenderData.lineAst)} instead.`
					)
				}
			})
			return lineRenderData.lineAst
		})

		// Combine rendered lines into a block AST and wrap it in an object that can be passed
		// through all hooks, allowing plugins to edit or completely replace the AST
		const blockRenderData = {
			blockAst: buildCodeBlockAstFromRenderedLines(renderedAstLines),
		}
		this.#getHooks('postprocessRenderedBlock').forEach(({ hookFn, plugin }) => {
			hookFn({ codeBlock, group, renderData: blockRenderData })
			if (!isHastParent(blockRenderData.blockAst)) {
				throw new Error(
					`Plugin ${plugin.name} set blockAst to an invalid value in its postprocessRenderedBlock hook. ` +
						`Expected a valid hast Parent, but got ${JSON.stringify(blockRenderData.blockAst)} instead.`
				)
			}
		})

		return blockRenderData.blockAst
	}

	/**
	 * Returns an array of hooks that were registered by plugins for the given hook type.
	 *
	 * Each hook is returned as an object containing the plugin that registered it,
	 * the hook function itself, and a context object that contains functions that should
	 * be available to the plugin when the hook is called.
	 */
	#getHooks<HookType extends keyof ExpressiveCodePluginHooks>(key: HookType) {
		return this.#config.plugins.flatMap((plugin) => {
			const hookFn = plugin.hooks[key]
			if (!hookFn) return []
			return [{ hookFn, plugin }]
		})
	}

	readonly #config: ExpressiveCodeConfig
}

export type PluginDataMap = WeakMap<ExpressiveCodePlugin, object>

export interface ScopedPluginData {
	global: PluginDataMap
	group: PluginDataMap
	block: PluginDataMap
}

export interface ExpressiveCodeProcessingState {
	canEditCode: boolean
	canEditMetadata: boolean
	canEditAnnotations: boolean
}

export function validateExpressiveCodeProcessingState(state: ExpressiveCodeProcessingState | undefined) {
	const isValid = state && isBoolean(state.canEditCode) && isBoolean(state.canEditMetadata) && isBoolean(state.canEditAnnotations)
	if (!isValid) throw newTypeError('ExpressiveCodeProcessingState', state)
}
