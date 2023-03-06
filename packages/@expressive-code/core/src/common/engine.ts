import { ExpressiveCodeBlock } from './block'
import { isBoolean, newTypeError } from '../internal/type-checks'
import { ExpressiveCodePlugin, ExpressiveCodePluginHooks, PluginDataScope } from './plugin'

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

		const runHook = (key: keyof ExpressiveCodePluginHooks) => {
			this.#config.plugins.forEach((plugin) => {
				const pluginHookFn = plugin.hooks[key]
				if (pluginHookFn) {
					pluginHookFn({
						codeBlock,
						getPluginData: this.#buildGetPluginDataFunc(plugin, blockPluginData),
					})
				}
			})
		}

		// Run hooks for preprocessing metadata and code
		state.canEditCode = false
		runHook('preprocessMetadata')
		state.canEditCode = true
		runHook('preprocessCode')

		// Run hooks for processing & finalizing the code
		runHook('performSyntaxAnalysis')
		runHook('postprocessAnalyzedCode')
		state.canEditCode = false

		// Run hooks for annotating the code
		runHook('annotateCode')
		runHook('postprocessAnnotations')
		state.canEditAnnotations = false

		// Render annotations and run rendering hooks
		// - Per line, do the following:
		//   - Flatten intersecting annotations, splitting the line into parts
		//   - Create an array of plaintext nodes for all resulting parts
		//   - Per annotation, do the following:
		//     - Ask the annotation to map their pieces of the array to a processed version,
		//       mutating the plaintext nodes with the results
		//   - runHook('postprocessRenderedLine') // Note: Needs some kind of line reference
		// - runHook('postprocessRenderedBlock')
		// - runHook('postprocessRenderedBlockGroup')
		// - Return processing result in a format that allows access to the AST

		return {
			codeBlock,
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
