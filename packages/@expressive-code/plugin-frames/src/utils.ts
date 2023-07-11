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
	terminal: ['ansi', 'bash', 'bat', 'batch', 'cmd', 'console', 'powershell', 'ps', 'ps1', 'psd1', 'psm1', 'sh', 'shell', 'shellscript', 'shellsession', 'zsh'],
	data: ['csv', 'env', 'ini', 'json', 'toml', 'xml', 'yaml', 'yml'],
	styles: ['css', 'less', 'sass', 'scss', 'styl', 'stylus', 'xsl'],
	textContent: ['markdown', 'md', 'mdx'],
}

export function isTerminalLanguage(language: string) {
	return LanguageGroups.terminal.includes(language)
}

const getFileNameCommentRegExpString = () =>
	[
		// Start of line
		`^`,
		// Optional whitespace
		`\\s*`,
		// Mandatory comment start: `//`, `#` (but not `#!`) or `<!--`
		`(?://|#(?!!)|<!--)`,
		// Optional whitespace
		`\\s*`,
		// Optional sequence of characters, followed by a Japanese colon or a regular colon (`:`),
		// but not by `://`. Matches strings like `File name:`, but not `https://example.com/test.md`.
		`(?:(.*?)(?:\\uff1a|:(?!//)))?`,
		// Optional whitespace
		`\\s*`,
		// Optional sequence of characters allowed in file paths
		`([\\w./~[\\]\\\\-]*`,
		// Optional dot and supported file extension
		`(?:\\.(?:${Object.values(LanguageGroups).flat().sort().join('|')}))?)`,
		// Optional whitespace
		`\\s*`,
		// Optional HTML comment end (`-->`)
		`(?:-->)?`,
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
export function getFileNameFromComment(line: string, lang: string) {
	if (fileNameCommentRegExp === undefined) {
		fileNameCommentRegExp = new RegExp(getFileNameCommentRegExpString())
	}
	const matches = fileNameCommentRegExp.exec(line)
	const extractedFileName = matches?.[2]
	if (!extractedFileName) return

	// Check if the syntax highlighting language is contained in our known language groups,
	// and determine the extension of the extracted file name (if any)
	const languageGroup = Object.values(LanguageGroups).find((group) => group.includes(lang))
	const fileExt = extractedFileName.match(/\.([^.]+)$/)?.[1]

	// If we're in the terminal language group, allow any file names (even without extensions)
	// as long as they start with something that looks like the beginning of a path
	if (languageGroup === LanguageGroups.terminal && extractedFileName.match(/^(\/|\\|\.|~)/)) {
		return extractedFileName
	}

	// Ignore the extracted file name if it doesn't have an extension,
	// or if its extension does not belong to the same language group
	// (e.g. JS code containing a CSS file name in a comment)
	if (!fileExt || (languageGroup && !languageGroup.includes(fileExt))) return

	return extractedFileName
}
