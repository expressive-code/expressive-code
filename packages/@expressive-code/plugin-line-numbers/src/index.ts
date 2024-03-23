import { ExpressiveCodePlugin } from '@expressive-code/core'
import { setInlineStyle, h } from '@expressive-code/core/hast'
import { lineNumbersStyleSettings, getLineNumbersBaseStyles } from './styles'
export { LineNumbersStyleSettings } from './styles'

export interface PluginLineNumbersProps {
	/**
	 * Whether to show line numbers on the current code block.
	 *
	 * The default value of this prop can be changed using the `defaultProps` option
	 * in your Expressive Code configuration. You can also change the default value by language
	 * using `defaultProps.overridesByLang`.
	 *
	 * @default true
	 */
	showLineNumbers: boolean
	/**
	 * The line number to start counting from.
	 *
	 * @default 1
	 */
	startLineNumber: number
}

declare module '@expressive-code/core' {
	export interface ExpressiveCodeBlockProps extends PluginLineNumbersProps {}
}

export function pluginLineNumbers(): ExpressiveCodePlugin {
	return {
		name: 'Line numbers',
		styleSettings: lineNumbersStyleSettings,
		baseStyles: (context) => getLineNumbersBaseStyles(context),
		hooks: {
			preprocessMetadata: ({ codeBlock: { metaOptions, props }, addGutterElement }) => {
				// Transfer meta options (if any) to props
				props.showLineNumbers = metaOptions.getBoolean('showLineNumbers') ?? props.showLineNumbers
				props.startLineNumber = metaOptions.getInteger('startLineNumber') ?? props.startLineNumber
				// Use props to determine if line numbers should be shown
				if (props.showLineNumbers !== false) {
					addGutterElement({
						renderPhase: 'earlier',
						renderLine: ({ codeBlock, lineIndex }) => {
							return h('div.ln', `${lineIndex + (codeBlock.props.startLineNumber ?? 1)}`)
						},
						renderPlaceholder: () => h('div.ln'),
					})
				}
			},
			postprocessRenderedBlock: ({ codeBlock, renderData }) => {
				// If the line numbers column needs more width than the default 2 characters,
				// adjust it to fit the longest line number
				const { startLineNumber = 1 } = codeBlock.props
				const endLineNumber = startLineNumber + codeBlock.getLines().length - 1
				const lnWidth = Math.max(startLineNumber.toString().length, endLineNumber.toString().length)
				if (lnWidth > 2) setInlineStyle(renderData.blockAst, '--lnWidth', `${lnWidth}ch`)
			},
		},
	}
}
