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
 * Preprocesses the given raw code snippet before being handed to the syntax highlighter.
 *
 * Does the following things:
 * - Trims empty lines at the beginning or end of the code block
 * - If `extractFileName` is true, checks the first lines for a comment line with a file name.
 *   - If a matching line is found, removes it from the code
 *     and returns the extracted file name in the result object.
 * - Normalizes whitespace and line endings
 */
export function preprocessCode(code: string, lang: string, extractFileName: boolean) {
	let extractedFileName: string | undefined
	let removedLineIndex: number | undefined
	let removedLineCount: number | undefined

	// Split the code into lines and remove any empty lines at the beginning & end
	const lines = code.split(/\r?\n/)
	while (lines.length > 0 && lines[0].trim().length === 0) {
		lines.shift()
	}
	while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
		lines.pop()
	}

	// If requested, try to find a file name comment in the first 5 lines of the given code
	if (extractFileName) {
		const lineIdx = lines.slice(0, 4).findIndex((line) => {
			const matches = FileNameCommentRegExp.exec(line)
			if (matches) {
				extractedFileName = matches[2]
				return true
			}
			return false
		})

		// If the syntax highlighting language is contained in our known language groups,
		// ensure that the extracted file name has an extension that matches the group
		if (extractedFileName) {
			const languageGroup = Object.values(LanguageGroups).find((group) => group.includes(lang))
			const fileExt = extractedFileName.match(/\.([^.]+)$/)?.[1]
			if (languageGroup && fileExt && !languageGroup.includes(fileExt)) {
				// The file extension does not match the syntax highlighting language,
				// so it's not a valid file name for this code snippet
				extractedFileName = undefined
			}
		}

		// Was a valid file name comment line found?
		if (extractedFileName) {
			// Yes, remove it from the code
			lines.splice(lineIdx, 1)
			removedLineIndex = lineIdx
			removedLineCount = 1
			// If the following line is empty, remove it as well
			if (!lines[lineIdx]?.trim().length) {
				lines.splice(lineIdx, 1)
				removedLineCount++
			}
		}
	}

	// If only one line is left, trim any leading indentation
	if (lines.length === 1) lines[0] = lines[0].trimStart()

	// Rebuild code with normalized line endings
	let preprocessedCode = lines.join('\n')

	// Convert tabs to 2 spaces
	preprocessedCode = preprocessedCode.replace(/\t/g, '  ')

	return {
		preprocessedCode,
		extractedFileName,
		removedLineIndex,
		removedLineCount,
	}
}
