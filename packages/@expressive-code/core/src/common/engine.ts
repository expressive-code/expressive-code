import { ExpressiveCodeBlock } from './block'
import { isBoolean, newTypeError } from '../internal/type-checks'
import { ExpressiveCodePlugin, ExpressiveCodePluginHooks, PluginDataScope } from './plugin'
import { buildCodeBlockFromRenderedAstLines, renderLineToAst } from '../internal/rendering'

export interface ExpressiveCodeConfig {
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins: ExpressiveCodePlugin[]
}

export class ExpressiveCode {
	constructor(config: ExpressiveCodeConfig) {
		this.#config = config
		this.#globalPluginData = new WeakMap()
	}

	processCode({ code, language, meta }: { code: string; language: string; meta: string }) {
		const state: ExpressiveCodeProcessingState = {
			canEditAnnotations: true,
			canEditCode: true,
			canEditMetadata: true,
		}

		const codeBlock = new ExpressiveCodeBlock({
			code,
			language,
			meta,
		})
		codeBlock.state = state

		const blockPluginData: PluginDataMap = new WeakMap()

		const getHooks = <HookType extends keyof ExpressiveCodePluginHooks>(key: HookType) => {
			return this.#config.plugins.flatMap((plugin) => {
				const hookFn = plugin.hooks[key]
				if (hookFn) {
					return [
						{
							plugin,
							hookFn,
							context: {
								getPluginData: this.#buildGetPluginDataFunc(plugin, blockPluginData),
							},
						},
					]
				} else {
					return []
				}
			})
		}

		const runHooks = (key: keyof Omit<ExpressiveCodePluginHooks, 'postprocessRenderedLine' | 'postprocessRenderedBlock'>) => {
			getHooks(key).forEach(({ hookFn, context }) => {
				hookFn({ codeBlock, ...context })
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

		// Render annotations and run rendering hooks
		const lines = codeBlock.getLines()
		const renderedAstLines = lines.map((line, lineIndex) => {
			const renderData = {
				lineAst: renderLineToAst(line),
			}
			// Allow plugins to modify or even completely replace the AST
			getHooks('postprocessRenderedLine').forEach(({ hookFn, context }) => {
				hookFn({ codeBlock, ...context, line, lineIndex, renderData })
			})
			return renderData.lineAst
		})

		// Combine rendered lines into a block AST
		const blockAst = buildCodeBlockFromRenderedAstLines(renderedAstLines)
		getHooks('postprocessRenderedBlock').forEach(({ hookFn, context }) => {
			hookFn({ codeBlock, ...context, renderData: { blockAst } })
		})

		// - runHooks('postprocessRenderedBlockGroup')
		// - Return processing result in a format that allows access to the AST

		return {
			codeBlock,
			blockAst,
		}
	}

	#buildGetPluginDataFunc(plugin: ExpressiveCodePlugin, blockPluginData: PluginDataMap) {
		const getPluginData = <Type extends object = object>(scope: PluginDataScope, initialValue: Type) => {
			const map = scope === 'global' ? this.#globalPluginData : blockPluginData
			let data = map.get(plugin) as Type
			if (data === undefined) {
				data = initialValue
				map.set(plugin, data)
			}
			return data
		}
		return getPluginData
	}

	readonly #config: ExpressiveCodeConfig
	readonly #globalPluginData: PluginDataMap
}

export type PluginDataMap = WeakMap<ExpressiveCodePlugin, object>

export type ExpressiveCodeProcessingState = {
	canEditCode: boolean
	canEditMetadata: boolean
	canEditAnnotations: boolean
}

export function validateExpressiveCodeProcessingState(state: ExpressiveCodeProcessingState | undefined) {
	const isValid = state && isBoolean(state.canEditCode) && isBoolean(state.canEditMetadata) && isBoolean(state.canEditAnnotations)
	if (!isValid) throw newTypeError('ExpressiveCodeProcessingState', state)
}
