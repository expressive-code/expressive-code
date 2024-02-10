import type { ExpressiveCodeBlock } from '@expressive-code/core'

export const frameTypes = ['code', 'terminal', 'none', 'auto'] as const

export type FrameType = (typeof frameTypes)[number]

/**
 * If the given input string represents a valid frame type,
 * converts it to a {@link FrameType} and returns it.
 *
 * Otherwise, returns `undefined`.
 */
export function frameTypeFromString(input: string) {
	// Support an empty string as alias for "none"
	if (input === '') input = 'none'

	// Fix common mistakes
	if (input === 'editor') input = 'code'
	if (input === 'shell') input = 'terminal'

	// Return either the converted type or undefined
	const frameType = input as FrameType
	return frameTypes.includes(frameType) ? frameType : undefined
}

export const LanguageGroups = {
	code: ['astro', 'cjs', 'htm', 'html', 'js', 'jsx', 'mjs', 'svelte', 'ts', 'tsx', 'typescript', 'vb', 'vue', 'vue-html'],
	terminal: ['ansi', 'bash', 'bat', 'batch', 'cmd', 'console', 'nu', 'nushell', 'powershell', 'ps', 'ps1', 'psd1', 'psm1', 'sh', 'shell', 'shellscript', 'shellsession', 'zsh'],
	data: ['csv', 'env', 'ini', 'json', 'toml', 'xml', 'yaml', 'yml'],
	styles: ['css', 'less', 'sass', 'scss', 'styl', 'stylus', 'xsl'],
	textContent: ['markdown', 'md', 'mdx'],
}

export const LanguagesWithFencedFrontmatter = ['astro', 'markdown', 'md', 'mdx', 'toml', 'yaml', 'yml']

export function isTerminalLanguage(language: string) {
	return LanguageGroups.terminal.includes(language)
}

const getFileNameCommentRegExpString = () =>
	[
		// Start of line
		`^`,
		// Optional whitespace
		`\\s*`,
		// Mandatory comment start: `//`, `#` (but not `#!`), `<!--` or `/*`
		`(?://|#(?!!)|<!--|/\\*)`,
		// Optional whitespace
		`\\s*`,
		// Optional prefix before the file name:
		// - This is intended to match strings like `File name:` or `Example :`,
		//   but not Windows drive letters like `C:`,
		//   or URL protocols like `https:`
		// - We therefore expect the prefix to begin with any sequence of characters
		//   not starting with a letter + colon (to rule out Windows drive letters)
		// - The prefix must then be followed by:
		//   - a Japanese colon (`\\uff1a`), or
		//   - a regular colon (`:`) not followed by `//` (to rule out URL protocols)
		`(?:((?![a-z]:).*?)(?:\\uff1a|:(?!//)))?`,
		// Optional whitespace
		`\\s*`,
		// Capture the file name
		`(`,
		// Optional Windows drive letter
		`(?:[a-z]:)?`,
		// Optional sequence of characters allowed in file paths
		`[\\w./~%[\\]\\\\-]*`,
		// Optional dot and supported file extension
		`(?:\\.(?:${Object.values(LanguageGroups).flat().sort().join('|')}))?`,
		// End of file name capture
		`)`,
		// Optional whitespace
		`\\s*`,
		// Optional HTML or JS/CSS comment end (`-->` or `*/`)
		`(?:-->|\\*/)?`,
		// Optional whitespace
		`\\s*`,
		// End of line
		`$`,
	].join('')

let fileNameCommentRegExp: RegExp | undefined

/**
 * Checks if the given source code line is a comment that contains a file name
 * for the code snippet.
 *
 * If the syntax highlighting language is contained in our known language groups,
 * only allows file names with extensions that belong to the same language group.
 */
export function getFileNameFromComment(line: string, lang: string): string | undefined {
	if (fileNameCommentRegExp === undefined) {
		fileNameCommentRegExp = new RegExp(getFileNameCommentRegExpString(), 'i')
	}
	const matches = fileNameCommentRegExp.exec(line)
	const textBeforeFileName = matches?.[1] ?? ''
	const possibleFileName = matches?.[2]
	if (!possibleFileName) return

	// Ignore strings that only consist of special characters (dots, path separators, etc.)
	if (!possibleFileName.match(/[^.:/\\~]/)) return

	// Ignore strings starting with two or more dots not followed by a path separator
	if (possibleFileName.match(/^\.{2,}(?!\/|\\)/)) return

	// Check if the syntax highlighting language is contained in our known language groups,
	// and determine the extension of the extracted file name (if any)
	const languageGroup = Object.values(LanguageGroups).find((group) => group.includes(lang))
	const fileNameWithoutPath = possibleFileName.replace(/^.*[/\\]/, '')
	const fileExt = fileNameWithoutPath.match(/\.([^.]+)$/)?.[1]

	// Check if the file name has one or more typical file name patterns:
	// - It begins with any of these and is followed by at least one more character:
	//   - `/` (Unix path separator)
	//   - `\` (Windows path separator)
	//   - `./` or `.\`) (current directory)
	//   - `~` (home directory)
	//   - `[a-z]:` (Windows drive letter)
	// - It has a file name part starting with a dot (e.g. `some/path/.gitignore`)
	// - It looks like a separated path (see below for details)
	const hasTypicalFileNameBeginning = possibleFileName.match(/^(\/|\\|\.[/\\]|~|[a-z]:).+/i)
	const hasFileNameStartingWithDot = fileNameWithoutPath.startsWith('.')
	const looksLikeSeparatedPath =
		// Contains path separators
		possibleFileName.match(/[/\\]/) &&
		// Also contains other characters (except path separators, numbers and dots)
		possibleFileName.match(/[^/\\0-9.]/) &&
		// Does not contain spaces
		!possibleFileName.match(/\s/) &&
		// Is all lowercase
		possibleFileName === possibleFileName.toLowerCase()
	const hasTypicalFileNamePattern = hasTypicalFileNameBeginning || hasFileNameStartingWithDot || looksLikeSeparatedPath

	// Accept anything that looks like a file name if at least one of these conditions is true:
	// - the file name is the only text in the comment
	// - we're in the terminal language group (where extensions are often missing or unknown)
	if (hasTypicalFileNamePattern && (!textBeforeFileName.length || languageGroup === LanguageGroups.terminal)) {
		return possibleFileName
	}

	// Ignore the extracted file name if it doesn't have an extension,
	// or if its extension does not belong to the same language group
	// (e.g. JS code containing a CSS file name in a comment)
	if (!fileExt || (languageGroup && !languageGroup.includes(fileExt))) return

	return possibleFileName
}

/**
 * Attempts to find and extract a file name from a comment on the first 4 lines of the code block.
 *
 * If a valid file name comment is found, it gets removed from the code block
 * and some cleanup work is performed on the surrounding lines:
 * - If the code block's language supports frontmatter, and the comment was located
 *   in a frontmatter block that has now become empty, the empty frontmatter block gets removed
 * - If the line following the removed comment (or removed frontmatter block) is empty,
 *   it gets removed as well
 *
 * @returns the extracted file name, or `undefined` if no valid file name comment was found
 */
export function extractFileNameFromCodeBlock(codeBlock: ExpressiveCodeBlock): string | undefined {
	// Check the first 4 lines of the code for a file name comment
	let extractedFileName: string | undefined = undefined
	let lineIdx = codeBlock.getLines(0, 4).findIndex((line) => {
		extractedFileName = getFileNameFromComment(line.text, codeBlock.language)
		return !!extractedFileName
	})

	// Abort if we didn't find a valid file name comment
	if (!extractedFileName) return

	// We found a file name comment, so remove it from the code
	codeBlock.deleteLine(lineIdx)

	// If the block's language supports frontmatter, and the removed comment
	// caused its frontmatter block to become empty, remove the empty block
	if (LanguagesWithFencedFrontmatter.includes(codeBlock.language)) {
		const openingFence = lineIdx > 0 ? codeBlock.getLine(lineIdx - 1)?.text.trim() : undefined
		const closingFence = codeBlock.getLine(lineIdx)?.text.trim()
		const isFrontmatterEmptyNow = openingFence === closingFence && ['---', '+++'].includes(openingFence ?? '')
		if (isFrontmatterEmptyNow) {
			lineIdx--
			codeBlock.deleteLine(lineIdx)
			codeBlock.deleteLine(lineIdx)
		}
	}

	// If the following line is empty, remove it as well
	if (codeBlock.getLine(lineIdx)?.text.trim().length === 0) {
		codeBlock.deleteLine(lineIdx)
	}

	return extractedFileName
}
