import { AttachedPluginData, ExpressiveCodePlugin, PluginTexts, replaceDelimitedValues } from '@expressive-code/core'
import { h, Result as HastEntity } from 'hastscript'
import { framesStyleSettings, getFramesBaseStyles } from './styles'
import { FrameType, frameTypeFromString, frameTypes, getFileNameFromComment, isTerminalLanguage, LanguageGroups } from './utils'
import { getCopyJsModule } from './copy-js-module'

export interface PluginFramesOptions {
	/**
	 * If this is true (default) and no title was found in the code block's meta string,
	 * the plugin will try to find and extract a comment line containing the code block file name
	 * from the first 4 lines of the code.
	 */
	extractFileNameFromCode?: boolean | undefined
	/**
	 * If this is true (default), a "Copy to clipboard" button
	 * will be shown for each code block.
	 */
	showCopyToClipboardButton?: boolean | undefined
	/**
	 * If this is true (default), the "Copy to clipboard" button of terminal window frames
	 * will remove comment lines starting with `#` from the copied text.
	 *
	 * This is useful to reduce the copied text to the actual commands users need to run,
	 * instead of also copying explanatory comments or instructions.
	 */
	removeCommentsWhenCopyingTerminalFrames?: boolean | undefined
	styleOverrides?: Partial<typeof framesStyleSettings.defaultSettings> | undefined
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
		baseStyles: ({ theme, coreStyles, styleOverrides }) => getFramesBaseStyles(theme, coreStyles, { ...styleOverrides.frames, ...options.styleOverrides }, options),
		jsModules: options.showCopyToClipboardButton ? [getCopyJsModule(`.expressive-code .copy button`)] : undefined,
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
				const blockData = pluginFramesData.getOrCreateFor(codeBlock)

				codeBlock.meta = replaceDelimitedValues(codeBlock.meta, ({ fullMatch, key, value }) => {
					// Handle titles in meta string
					if (key?.match(/^@?title$/i)) {
						blockData.title = value
						return ''
					}

					// Handle frame types in meta string
					if (key?.match(/^@?frame(Type)?$/i)) {
						const frameType = frameTypeFromString(value)
						if (frameType === undefined)
							throw new Error(
								`Invalid frame type \`${value}\` found in code block meta string.
								Valid frame types are: ${frameTypes.join(', ')}.`.replace(/\s+/g, ' ')
							)
						blockData.frameType = frameType
						return ''
					}

					// Leave all other key-value pairs untouched
					return fullMatch
				})
			},
			preprocessCode: ({ codeBlock }) => {
				// Skip processing if the given options do not allow file name extraction from code
				if (!options.extractFileNameFromCode) return

				const blockData = pluginFramesData.getOrCreateFor(codeBlock)

				// If the block data we collected while parsing the meta information
				// did not contain a title, and if the frame type wasn't set to "none",
				// try to find a title inside the code
				if (blockData.title === undefined && blockData.frameType !== 'none') {
					// Check the first 4 lines of the code for a file name comment
					const lineIdx = codeBlock.getLines(0, 4).findIndex((line) => {
						blockData.title = getFileNameFromComment(line.text, codeBlock.language)
						return !!blockData.title
					})

					// Was a valid file name comment line found?
					if (blockData.title) {
						// Yes, remove it from the code
						codeBlock.deleteLine(lineIdx)

						// If the following line is empty, remove it as well
						if (codeBlock.getLine(lineIdx)?.text.trim().length === 0) {
							codeBlock.deleteLine(lineIdx)
						}
					}
				}

				// If we're supposed to auto-detect the code block's frame type,
				// and a terminal/shell language like "sh" or "powershell" was assigned to it,
				// we need to perform some extra checks. There are two possible cases:
				// - It's a script file (= to be rendered as an editor frame)
				// - It shows an interactive shell session (= terminal window frame)
				const { frameType = 'auto' } = blockData
				if (frameType === 'auto' && isTerminalLanguage(codeBlock.language)) {
					// If we found a valid file name comment or shebang,
					// it's a script file and not a terminal session
					const titleIsFileName = blockData.title && getFileNameFromComment(`// ${blockData.title}`, codeBlock.language)
					if (titleIsFileName || codeBlock.getLines(0, 4).some((line) => line.text.match(/^\s*#!/))) {
						blockData.frameType = 'code'
					}
				}
			},
			postprocessRenderedBlock: ({ codeBlock, renderData, locale }) => {
				// Get text strings for the current locale
				const texts = pluginFramesTexts.get(locale)

				// Retrieve information about the current block
				const blockData = pluginFramesData.getOrCreateFor(codeBlock)
				const { title: titleText, frameType = 'auto' } = blockData
				const isTerminal = frameType === 'terminal' || (frameType === 'auto' && isTerminalLanguage(codeBlock.language))

				// TODO: Improve the ability to wrap long file paths into multiple lines
				// by inserting a line break opportunity after each slash
				// const titleHtml = decodeURIComponent(title).replace(/([\\/])/g, '$1<wbr/>')

				// If frameType is not "none" and a title was given, render it as a visible span.
				// Also render a visible (but empty) span for terminals without a title
				// to keep the same window caption line height.
				const visibleTitle = (frameType !== 'none' && titleText) || isTerminal ? [h('span', { className: 'title' }, titleText || '')] : []

				// Otherwise, render a screen reader-only title for terminals
				// to clarify that the code block is a terminal window
				const screenReaderTitle = !titleText && isTerminal ? [h('span', { className: 'sr-only' }, texts.terminalWindowFallbackTitle)] : []

				const extraElements: HastEntity[] = []

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
							...(frameType !== 'none' && titleText ? ['has-title'] : []),
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

export interface PluginFramesData {
	title?: string | undefined
	frameType?: FrameType | undefined
}

export const pluginFramesData = new AttachedPluginData<PluginFramesData>(() => ({}))

export { LanguageGroups }
