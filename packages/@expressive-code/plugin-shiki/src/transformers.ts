import { ExpressiveCodeBlock } from '@expressive-code/core'
import type { PluginShikiOptions } from '.'
import type { CodeToHastOptions, ShikiTransformer, ShikiTransformerContextSource, ThemedToken } from 'shiki'

export type BaseHookArgs = {
	options: PluginShikiOptions
	code: string
	codeBlock: ExpressiveCodeBlock
	codeToTokensOptions: CodeToHastOptions
}

/**
 * Throws an error if any of the configured transformers use unsupported hooks.
 */
export function validateTransformers(options: PluginShikiOptions) {
	if (!options.transformers) return
	const unsupportedTransformerHooks: (keyof ShikiTransformer)[] = ['code', 'line', 'postprocess', 'pre', 'root', 'span']
	for (const transformer of options.transformers) {
		const unsupportedHook = unsupportedTransformerHooks.find((hook) => transformer[hook] != null)
		if (unsupportedHook) {
			throw new ExpressiveCodeShikiTransformerError(transformer, `The transformer hook "${unsupportedHook}" is not supported by Expressive Code yet.`)
		}
	}
}

export function runPreprocessHook(args: BaseHookArgs) {
	const { options, code, codeBlock, codeToTokensOptions } = args
	options.transformers?.forEach((transformer) => {
		if (!transformer.preprocess) return
		const transformerContext = getTransformerContext({ transformer, code, codeBlock, codeToTokensOptions })
		const transformedCode = transformer.preprocess.call(transformerContext, code, codeToTokensOptions)
		if (typeof transformedCode === 'string' && transformedCode !== code) {
			throw new ExpressiveCodeShikiTransformerError(transformer, `Transformers that modify code in the "preprocess" hook are not supported yet.`)
		}
	})
}

export function runTokensHook(args: BaseHookArgs & { tokenLines: ThemedToken[][] }) {
	const { options, code, codeBlock, codeToTokensOptions } = args
	const originalTokenLinesText = getTokenLinesText(args.tokenLines)
	options.transformers?.forEach((transformer) => {
		if (!transformer.tokens) return
		const transformerContext = getTransformerContext({ transformer, code, codeBlock, codeToTokensOptions })
		const transformedTokenLines = transformer.tokens.call(transformerContext, args.tokenLines)
		// Transformers can either mutate the tokens in place,
		// or return a new array of tokens
		if (transformedTokenLines) {
			args.tokenLines = transformedTokenLines
		}
		// Ensure that the transformer didn't change the text contents of the tokens
		const newTokenLinesText = getTokenLinesText(args.tokenLines)
		if (originalTokenLinesText.length !== args.tokenLines.length) {
			throw new ExpressiveCodeShikiTransformerError(
				transformer,
				`Transformers that modify code in the "tokens" hook are not supported yet. The number of lines changed from ${originalTokenLinesText.length} to ${args.tokenLines.length}.`
			)
		}
		for (let i = 0; i < newTokenLinesText.length; i++) {
			if (originalTokenLinesText[i] !== newTokenLinesText[i]) {
				throw new ExpressiveCodeShikiTransformerError(
					transformer,
					`Transformers that modify code in the "tokens" hook are not supported yet. Line ${i + 1} changed from "${originalTokenLinesText[i]}" to "${newTokenLinesText[i]}".`
				)
			}
		}
	})
	return args.tokenLines
}

function getTokenLinesText(tokenLines: ThemedToken[][]) {
	return tokenLines.map((line) => line.map((token) => token.content).join(''))
}

export function getTransformerContext(contextBase: {
	transformer: ShikiTransformer
	code: string
	codeBlock: ExpressiveCodeBlock
	codeToTokensOptions: CodeToHastOptions
}): ShikiTransformerContextSource {
	const { transformer, code, codeBlock, codeToTokensOptions } = contextBase
	const getUnsupportedFnHandler = (name: string) => {
		return () => {
			throw new ExpressiveCodeShikiTransformerError(transformer, `The context function "${name}" is not available in Expressive Code transformers yet.`)
		}
	}
	return {
		source: code,
		options: codeToTokensOptions,
		meta: {
			...(Object.fromEntries(codeBlock.metaOptions.list().map((option) => [option.key, option.value])) as Record<string, string | boolean | RegExp>),
			__raw: codeBlock.meta,
		},
		codeToHast: getUnsupportedFnHandler('codeToHast'),
		codeToTokens: getUnsupportedFnHandler('codeToTokens'),
	}
}

export class ExpressiveCodeShikiTransformerError extends Error {
	constructor(transformer: ShikiTransformer, message: string) {
		super(
			`Failed to run Shiki transformer${transformer.name ? ` "${transformer.name}"` : ''}: ${message}
			
			IMPORTANT: This is not a bug - neither in Shiki, nor in the transformer or Expressive Code.
			Transformer support in Expressive Code is still experimental and limited to a few cases
			(e.g. transformers that modify syntax highlighting tokens).

			To continue, remove this transformer from the Expressive Code configuration,
			or visit the following link for more information and other options:
			https://expressive-code.com/key-features/syntax-highlighting/#transformers`
				.replace(/^\t+/gm, '')
				.replace(/(?<!\n)\n(?!\n)/g, ' ')
		)
		this.name = 'ExpressiveCodeShikiTransformerError'
	}
}
