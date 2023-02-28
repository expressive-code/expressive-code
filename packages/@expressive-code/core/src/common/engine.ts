import { ExpressiveCodeBlock } from './block'
import { ExpressiveCodePlugin, ExpressiveCodePluginHooks } from './plugin'
import { z } from 'zod'

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

		const runHook = (key: keyof ExpressiveCodePluginHooks) => {
			this.#config.plugins.forEach((plugin) => {
				const pluginHookFn = plugin.hooks[key]
				if (pluginHookFn) {
					pluginHookFn({ codeBlock })
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
		// - Return processing result in a format that allows access to the AST
	}

	readonly #config: ExpressiveCodeConfig
}

const invalidExpressiveCodeProcessingState = 'When setting the state of a code block, you must specify a valid state object.'
export const ExpressiveCodeProcessingState = z.object(
	{
		canEditCode: z.boolean(),
		canEditMetadata: z.boolean(),
		canEditAnnotations: z.boolean(),
	},
	{
		required_error: invalidExpressiveCodeProcessingState,
		invalid_type_error: invalidExpressiveCodeProcessingState,
	}
)

export type ExpressiveCodeProcessingState = z.infer<typeof ExpressiveCodeProcessingState>
