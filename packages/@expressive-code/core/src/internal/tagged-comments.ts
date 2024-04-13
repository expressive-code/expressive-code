export type TextRange = {
	start: {
		line: number
		column?: number | undefined
	}
	end: {
		line: number
		column?: number | undefined
	}
}

export type CommentTag = {
	/**
	 * The name of the tag.
	 *
	 * In the tags `[!example]` or `[!code example]`,
	 * this property would contain `example`.
	 */
	name: string
	/**
	 * The search term contained in the tag (if any). This can be used to
	 * target specific words or phrases in the surrounding code.
	 *
	 * The term can either be a string (optionally wrapped in single or double quotes),
	 * or a regular expression wrapped in forward slashes.
	 *
	 * Example tags containing plaintext search terms:
	 * - `[!mark:unquoted text with brackets \] and colons \: inside]`
	 * - `[!del:"quoted text can contain colons : and brackets ] without escaping"]`
	 * - `[!ins:'quote "nesting" or \'escaping\' also works']`
	 *
	 * Example tags containing regular expressions:
	 * - `[!mark:/good (?:morning|evening|night)/]`
	 * - `[!ins:/escape slashes like \/, but not [a-z]+, "quotes" etc./]`
	 */
	searchTerm: string | RegExp | undefined
	/**
	 * The quantifier contained in the tag (if any).
	 *
	 * Quantifiers are positive or negative integers at the very end of a tag.
	 * They can be used to define how many lines are targeted by the tag,
	 * or how many times a given search term should be matched.
	 * If omitted, the default is 1 (targeting 1 line or search term match).
	 *
	 * Line targeting logic:
	 * - If a tagged comment starts at the end of a non-empty line,
	 *   it targets the same line.
	 * - If it starts on its own line, it targets the line below.
	 * - If the line below does not exist or is empty, it targets the line above instead.
	 * - Line targeting and counting skips any lines that are part of a tagged comment.
	 *
	 * Example tags containing quantifiers:
	 * - `[!del:3]` targets 3 lines downwards
	 * - `[!ins:-1]` targets the line above
	 * - `[!mark:props:2]` targets the next 2 matches of the term "props"
	 * - `[!mark:JSON:-3]` targets the previous 3 matches of the term "JSON"
	 */
	quantifier?: number | undefined
}

export type TaggedComment = {
	tag: CommentTag
	commentOuterRange: TextRange
	/**
	 * All text ranges inside the tagged comment that appear after the tag,
	 * excluding any comment syntax (e.g. `//` or `/*`).
	 *
	 * See {@link TaggedComment.commentText `commentText`} for an example.
	 */
	commentTextRanges: TextRange[]
	/**
	 * The text contained in {@link TaggedComment.commentTextRanges `commentTextRanges`}.
	 *
	 * Consider the following example code:
	 * ```js
	 * // [!note] These are the contents of a tagged comment.
	 * // They can span multiple lines and end automatically
	 * // when a non-comment line is encountered.
	 * console.log('hello');
	 * ```
	 *
	 * Here, `commentText` would be:
	 * ```plaintext
	 * These are the contents of a tagged comment.
	 * They can span multiple lines and end automatically
	 * when a non-comment line is encountered.
	 * ```
	 */
	commentText: string
	// targetRanges: TextRange[]
}

// Returns what? Objects with start and end line & column for the outer bounds of comments,
// the tags themselves with their name and target.
export function parseTaggedComments(lines: string[], knownTagNames: string[]) {}
