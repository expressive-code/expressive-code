import { ExpressiveCodePlugin, PluginTexts } from '@expressive-code/core'
import type { Element } from '@expressive-code/core/hast'
import { h } from '@expressive-code/core/hast'
import { framesStyleSettings, getFramesBaseStyles } from './styles'
import {
	extractFileNameFromCodeBlock,
	FrameType,
	frameTypeFromString,
	frameTypes,
	getFileNameFromComment,
	isTerminalLanguage,
	LanguageGroups,
	LanguagesWithFencedFrontmatter,
} from './utils'
import copyJsModule from './copy-js-module.min'
export type { FramesStyleSettings } from './styles'

export interface PluginFramesOptions {
	/**
	 * If `true`, and no title was found in the code block's meta string,
	 * the plugin will try to find and extract a comment line containing the code block file name
	 * from the first 4 lines of the code.
	 *
	 * @default true
	 */
	extractFileNameFromCode?: boolean | undefined
	/**
	 * If `true`, a "Copy to clipboard" button will be shown for each code block.
	 *
	 * @default true
	 */
	showCopyToClipboardButton?: boolean | undefined
	/**
	 * If `true`, the "Copy to clipboard" button of terminal window frames
	 * will remove comment lines starting with `#` from the copied text.
	 *
	 * This is useful to reduce the copied text to the actual commands users need to run,
	 * instead of also copying explanatory comments or instructions.
	 *
	 * @default true
	 */
	removeCommentsWhenCopyingTerminalFrames?: boolean | undefined
}

export interface PluginFramesProps {
	/**
	 * The code block's title. For terminal frames, this is displayed as the terminal window title,
	 * and for code frames, it's displayed as the file name in an open file tab.
	 *
	 * If no title is given, the plugin will try to automatically extract a title from a
	 * [file name comment](https://expressive-code.com/key-features/frames/#file-name-comments)
	 * inside your code, unless disabled by the `extractFileNameFromCode` option.
	 */
	title: string
	/**
	 * Allows you to override the automatic frame type detection for a code block.
	 *
	 * The supported values are `code`, `terminal`, `none` and `auto`.
	 *
	 * @default `auto`
	 */
	frame: FrameType
}

declare module '@expressive-code/core' {
	export interface ExpressiveCodeBlockProps extends PluginFramesProps {}
}

export const pluginFramesTexts = new PluginTexts({
	terminalWindowFallbackTitle: 'Terminal window',
	copyButtonTooltip: 'Copy to clipboard',
	copyButtonCopied: 'Copied!',
})

pluginFramesTexts.addLocale('de', {
	terminalWindowFallbackTitle: 'Terminal-Fenster',
	copyButtonTooltip: 'In die Zwischenablage kopieren',
	copyButtonCopied: 'Kopiert!',
})

export function pluginFrames(options: PluginFramesOptions = {}): ExpressiveCodePlugin {
	// Apply default settings
	options = {
		extractFileNameFromCode: true,
		showCopyToClipboardButton: true,
		removeCommentsWhenCopyingTerminalFrames: true,
		...options,
	}
	return {
		name: 'Frames',
		styleSettings: framesStyleSettings,
		baseStyles: (context) => getFramesBaseStyles(context, options),
		jsModules: options.showCopyToClipboardButton ? [copyJsModule.replace(/\[SELECTOR\]/g, '.expressive-code .copy button')] : undefined,
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
				// Transfer meta options (if any) to props
				const { metaOptions, props } = codeBlock
				props.title = metaOptions.getString('title') ?? props.title
				const frame = metaOptions.getString('frame')
				if (frame !== undefined) {
					const frameType = frameTypeFromString(frame)
					if (frameType === undefined)
						throw new Error(
							`Invalid frame type \`${frame}\` found in code block meta string.
							Valid frame types are: ${frameTypes.join(', ')}.`.replace(/\s+/g, ' ')
						)
					props.frame = frameType
				}
			},
			preprocessCode: ({ codeBlock }) => {
				const { props, language } = codeBlock

				// If our props do not contain a title, the frame type wasn't set to "none",
				// and extracting file names from the code is enabled,
				// try to find and extract a title from the code
				if (props.title === undefined && props.frame !== 'none' && options.extractFileNameFromCode) {
					props.title = extractFileNameFromCodeBlock(codeBlock)
				}

				// If we're supposed to auto-detect the code block's frame type,
				// and a terminal/shell language like "sh" or "powershell" was assigned to it,
				// we need to perform some extra checks. There are two possible cases:
				// - It's a script file (= to be rendered as an editor frame)
				// - It shows an interactive shell session (= terminal window frame)
				if ((props.frame ?? 'auto') === 'auto' && isTerminalLanguage(language)) {
					// If we found a valid file name comment or shebang,
					// it's a script file and not a terminal session
					const titleIsFileName = props.title && getFileNameFromComment(`// ${props.title}`, language)
					if (titleIsFileName || codeBlock.getLines(0, 4).some((line) => line.text.match(/^\s*#!/))) {
						props.frame = 'code'
					}
				}
			},
			postprocessRenderedBlock: ({ codeBlock, renderData, locale }) => {
				// Get text strings for the current locale
				const texts = pluginFramesTexts.get(locale)

				// Retrieve information about the current block
				const { title: titleText, frame = 'auto' } = codeBlock.props
				const isTerminal = frame === 'terminal' || (frame === 'auto' && isTerminalLanguage(codeBlock.language))

				// TODO: Improve the ability to wrap long file paths into multiple lines
				// by inserting a line break opportunity after each slash
				// const titleHtml = decodeURIComponent(title).replace(/([\\/])/g, '$1<wbr/>')

				// If frameType is not "none" and a title was given, render it as a visible span.
				// Also render a visible (but empty) span for terminals without a title
				// to keep the same window caption line height.
				const visibleTitle = (frame !== 'none' && titleText) || isTerminal ? [h('span', { className: 'title' }, titleText || '')] : []

				// Otherwise, render a screen reader-only title for terminals
				// to clarify that the code block is a terminal window
				const screenReaderTitle = !titleText && isTerminal ? [h('span', { className: 'sr-only' }, texts.terminalWindowFallbackTitle)] : []

				const extraElements: Element[] = []

				// If enabled, create a button to copy the code to the clipboard
				if (options.showCopyToClipboardButton) {
					let codeToCopy = codeBlock.code

					// If enabled, remove comment lines starting with `#` from terminal frames
					if (options.removeCommentsWhenCopyingTerminalFrames && isTerminal) {
						codeToCopy = codeToCopy.replace(/(?<=^|\n)\s*#.*($|\n+)/g, '').trim()
					}

					// Replace all line breaks with a special character
					// because HAST does not encode them in attribute values
					// (which seems to work, but looks ugly in the HTML source)
					codeToCopy = codeToCopy.replace(/\n/g, '\u007f')

					extraElements.push(
						h('div', { className: 'copy' }, [
							h('div', { 'aria-live': 'polite' }),
							h(
								'button',
								{
									title: texts.copyButtonTooltip,
									'data-copied': texts.copyButtonCopied,
									'data-code': codeToCopy,
								},
								[h('div')]
							),
						])
					)
				}

				// Wrap the code block in a figure element with helpful classes for styling
				renderData.blockAst = h(
					'figure',
					{
						className: [
							'frame',
							// If the code block is a terminal, add the `is-terminal` class
							...(isTerminal ? ['is-terminal'] : []),
							// If the code block has a title, add the `has-title` class
							...(frame !== 'none' && titleText ? ['has-title'] : []),
						],
					},
					[
						h('figcaption', { className: 'header' }, [...visibleTitle, ...screenReaderTitle]),
						// Render the original code block
						renderData.blockAst,
						// Add any extra elements (e.g. copy button)
						...extraElements,
					]
				)
			},
		},
	}
}

export { LanguageGroups, LanguagesWithFencedFrontmatter }
