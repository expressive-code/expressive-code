import { Annotations } from '../common'

export type PreprocessCodeOptions = {
	/**
	 * If true, preprocessing will try to find and extract a comment line containing
	 * the code snippet file name from the first 4 lines of the code.
	 */
	extractFileName: boolean
	/**
	 * Pass all existing annotations here that are defined outside of the code,
	 * e.g. in Markdown/MDX code fences or external sources.
	 *
	 * If preprocessing removes any special comments or lines from the code, shifted line numbers
	 * in existing annotations will be updated automatically.
	 */
	annotations?: Annotations
}

export type PreprocessCodeResult = {
	code: string
	extractedFileName?: string
	annotations: Annotations
}

/**
 * Preprocesses the given raw code snippet before being handed to the syntax highlighter.
 *
 * Does the following things:
 * - Trims empty lines at the beginning or end of the code block
 * - If the option {@link PreprocessCodeOptions.extractFileName extractFileName} is true,
 *   checks the first 4 lines for a comment line with a file name
 *   - If a matching line is found, removes it from the code
 *     and returns the extracted file name in the result object
 * - Normalizes whitespace and line endings
 */
export function preprocessCode(code: string, lang: string, options: PreprocessCodeOptions): PreprocessCodeResult {
	const { extractFileName, annotations = {} } = options

	let extractedFileName: string | undefined

	// Split the code into lines and remove any empty lines at the beginning & end
	const lines = code.split(/\r?\n/)
	while (lines.length > 0 && lines[0].trim().length === 0) {
		lines.shift()
	}
	while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
		lines.pop()
	}

	// If requested, try to find a file name comment in the first 4 lines of the given code
	if (extractFileName) {
		const lineIdx = lines.slice(0, 4).findIndex((line) => {
			extractedFileName = getFileNameFromComment(line, lang)
			return !!extractedFileName
		})

		// Was a valid file name comment line found?
		if (extractedFileName) {
			// Yes, remove it from the code
			removeLines({ lines, annotations, lineIndex: lineIdx, lineCount: 1 })

			// If the following line is empty, remove it as well
			if (!lines[lineIdx]?.trim().length) {
				removeLines({ lines, annotations, lineIndex: lineIdx, lineCount: 1 })
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
		code: preprocessedCode,
		extractedFileName,
		annotations,
	}
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

function removeLines({
	lines,
	annotations,
	lineIndex,
	lineCount = 1,
}: {
	/** Array to remove the given lines from. */
	lines: string[]
	/** Annotations to update when following line numbers are shifted by the removal. */
	annotations: Annotations
	lineIndex: number
	lineCount?: number
}) {
	lines.splice(lineIndex, lineCount)
	// If any lines were removed during preprocessing,
	// automatically shift marked line numbers accordingly
	annotations.lineMarkings?.forEach((lineMarking) => {
		lineMarking.lines = lineMarking.lines
			.map((lineNum) => {
				if (lineNum <= lineIndex) return lineNum
				if (lineNum > lineIndex + lineCount) return lineNum - lineCount
				return -1
			})
			.filter((lineNum) => lineNum > -1)
	})
}
