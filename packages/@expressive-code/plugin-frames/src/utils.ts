export function isTerminalLanguage(language: string) {
	return ['shellscript', 'shell', 'bash', 'sh', 'zsh'].includes(language)
}

const LanguageGroups = {
	code: ['astro', 'cjs', 'htm', 'html', 'js', 'jsx', 'mjs', 'svelte', 'ts', 'tsx', 'vue'],
	data: ['env', 'json', 'yaml', 'yml'],
	styles: ['css', 'less', 'sass', 'scss', 'styl', 'stylus'],
	textContent: ['markdown', 'md', 'mdx'],
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
export function getFileNameFromComment(line: string, lang: string) {
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
