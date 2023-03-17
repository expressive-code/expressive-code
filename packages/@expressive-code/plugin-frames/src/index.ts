import { AttachedPluginData } from '@expressive-code/core'
import { ExpressiveCodePlugin, replaceDelimitedValues } from '@expressive-code/core'
import { h } from 'hastscript'

export interface FramesPluginOptions {
	/**
	 * If this is true (default) and no title was found in the code block's meta string,
	 * the plugin will try to find and extract a comment line containing the code block file name
	 * from the first 4 lines of the code.
	 */
	extractFileNameFromCode?: boolean
}

export interface FramesPluginData {
	title?: string
}

export const framesPluginData = new AttachedPluginData<FramesPluginData>(() => ({}))

export function frames({ extractFileNameFromCode = true }: FramesPluginOptions = {}): ExpressiveCodePlugin {
	return {
		name: 'Frames',
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
				const blockData = framesPluginData.getOrCreateFor(codeBlock)

				codeBlock.meta = replaceDelimitedValues(codeBlock.meta, ({ fullMatch, key, value }) => {
					// Handle "title" and "@title" keys in meta string
					if (key === 'title' || key === '@title') {
						blockData.title = value
						return ''
					}

					// Leave all other key-value pairs untouched
					return fullMatch
				})
			},
			preprocessCode: ({ codeBlock }) => {
				// Skip processing if the given options do not allow file name extraction from code
				if (!extractFileNameFromCode) return

				const blockData = framesPluginData.getOrCreateFor(codeBlock)

				// If we already extracted a title from the meta information,
				// do not attempt to find a title inside the code
				if (blockData.title) return

				// Attempt to find a file name comment in the first 4 lines of the code
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
			},
			postprocessRenderedBlock: ({ codeBlock, renderData }) => {
				// Retrieve information about the current block
				const titleText = framesPluginData.getOrCreateFor(codeBlock).title
				const isTerminal = isTerminalLanguage(codeBlock.language)

				// If a title was given, render it as a visible span
				const visibleTitle = titleText ? [h('span', { className: 'title' }, titleText)] : []

				// Otherwise, render a screen reader-only title for terminals
				// to clarify that the code block is a terminal window
				const fallbackTerminalWindowTitle = 'Terminal window' // TODO: i18n
				const screenReaderTitle = !titleText && isTerminal ? [h('span', { className: 'sr-only' }, fallbackTerminalWindowTitle)] : []

				// Wrap the code block in a figure element with helpful classes for styling
				renderData.blockAst = h(
					'figure',
					{
						className: [
							'code-snippet',
							// If the code block is a terminal, add the `is-terminal` class
							...(isTerminal ? ['is-terminal'] : []),
							// If the code block has a title, add the `has-title` class
							...(titleText ? ['has-title'] : []),
						],
					},
					[
						h('figcaption', { className: 'header' }, [...visibleTitle, ...screenReaderTitle]),
						// Render the original code block
						renderData.blockAst,
					]
				)
			},
		},
	}
}

const LanguageGroups = {
	code: ['astro', 'cjs', 'htm', 'html', 'js', 'jsx', 'mjs', 'svelte', 'ts', 'tsx', 'vue'],
	data: ['env', 'json', 'yaml', 'yml'],
	styles: ['css', 'less', 'sass', 'scss', 'styl', 'stylus'],
	textContent: ['markdown', 'md', 'mdx'],
}

function isTerminalLanguage(language: string) {
	return ['shellscript', 'shell', 'bash', 'sh', 'zsh'].includes(language)
}

const FileNameCommentRegExp = new RegExp(
	[
		// Start of line
		`^`,
		// Optional whitespace
		`\\s*`,
		// Mandatory comment start (`//`, `#` or `<!--`)
		`(?://|#|<!--)`,
		// Optional whitespace
		`\\s*`,
		// Optional sequence of characters, followed by a Japanese colon or a regular colon (`:`),
		// but not by `://`. Matches strings like `File name:`, but not `https://example.com/test.md`.
		`(?:(.*?)(?:\\uff1a|:(?!//)))?`,
		// Optional whitespace
		`\\s*`,
		// Optional sequence of characters allowed in file paths
		`([\\w./[\\]\\\\-]*`,
		// Mandatory dot and supported file extension
		`\\.(?:${Object.values(LanguageGroups).flat().sort().join('|')}))`,
		// Optional whitespace
		`\\s*`,
		// Optional HTML comment end (`-->`)
		`(?:-->)?`,
		// Optional whitespace
		`\\s*`,
		// End of line
		`$`,
	].join('')
)

/**
 * Checks if the given source code line is a comment that contains a file name
 * for the code snippet.
 *
 * If the syntax highlighting language is contained in our known language groups,
 * only allows file names with extensions that belong to the same language group.
 */
function getFileNameFromComment(line: string, lang: string) {
	const matches = FileNameCommentRegExp.exec(line)
	const extractedFileName = matches?.[2]
	if (!extractedFileName) return

	// Ignore the extracted file name if its extension does not belong to the same language group
	// (e.g. JS code containing a CSS file name in a comment)
	const languageGroup = Object.values(LanguageGroups).find((group) => group.includes(lang))
	const fileExt = extractedFileName.match(/\.([^.]+)$/)?.[1]
	if (languageGroup && fileExt && !languageGroup.includes(fileExt)) return

	return extractedFileName
}
