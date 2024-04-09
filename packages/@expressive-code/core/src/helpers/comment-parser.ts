type Range = {
	start: number
	end: number
}

interface Comment {
	outerRange: Range
	contentRange: Range
	outerText: string
	text: string
	type: 'single' | 'multi'
}

type ParserState =
	| {
			parser: (ctx: ParsingContext) => void
	  }
	| {
			capturing: true
			parser: (ctx: ParsingContext) => boolean
	  }

interface ParsingContext {
	code: string
	i: number
	commentStart: number
	commentContentStart: number
	escaped: boolean
	comments: Comment[]
	stateStack: Array<ParserState>
	enterState: (state: ParserState) => void
	exitState: () => void
	currentState: () => ParserState
	allCapturingStates: () => ParserState[]
}

export function parseComments(code: string, language: string) {
	const parse = createParser(getInitialStateByLanguage(language))
	return parse(code)
}

function createParser(initialState: ParserState) {
	return function (code: string) {
		const ctx: ParsingContext = {
			code: code,
			i: 0,
			commentStart: -1,
			commentContentStart: -1,
			escaped: false,
			comments: [],
			stateStack: [],
			enterState: function (state) {
				this.stateStack.push(state)
			},
			exitState: function () {
				if (this.stateStack.length > 0) {
					this.stateStack.pop()
				}
			},
			currentState: function () {
				return this.stateStack[this.stateStack.length - 1] || initialState
			},
			allCapturingStates: function () {
				return this.stateStack.filter((state) => 'capturing' in state && state.capturing === true)
			},
		}

		// Loop through the code, calling the current state function
		// (note that we also call it once past the end of the code
		// to ensure that any final state can be handled)
		for (; ctx.i <= ctx.code.length; ctx.i++) {
			if (ctx.allCapturingStates().some((state) => state.parser(ctx))) continue
			ctx.currentState().parser(ctx)
		}
		return ctx.comments
	}
}

function getInitialStateByLanguage(language: string): ParserState {
	switch (language) {
		case 'htm':
		case 'html':
		case 'xsl':
			return { parser: parseBaseHtmlCode }
		case 'md':
		case 'markdown':
			return { parser: parseBaseMdCode }
		case 'mdx':
			return { parser: parseBaseMdxCode }
		default:
			return { parser: parseBaseJsCode }
	}
}

// TODO: HTML can include <script> and <style> elements that switch to JS and CSS parsing!

// Astro:
// - Frontmatter supports JS comments
// - Template supports both HTML and JSX comments

// YAML, Vyper
// # comments

// WebAssembly
// ;; comments

function parseBaseHtmlCode(ctx: ParsingContext) {
	if (handleMultiLineComment({ ctx, openingSequence: '<!--', closingSequence: '-->' })) return
}

function parseBaseMdCode(ctx: ParsingContext) {
	if (handleFencedCodeBlock({ ctx })) return
	if (handleMultiLineComment({ ctx, openingSequence: '<!--', closingSequence: '-->' })) return
}

function parseBaseMdxCode(ctx: ParsingContext) {
	// if (handleMultiLineComment({ ctx, openingSequence: /^\{\s*\/\*/, closingSequence: /^\*\/\s*}/ })) return
	if (handleFencedCodeBlock({ ctx })) return
	if (handleJsx({ ctx })) return
}

function parseBaseJsCode(ctx: ParsingContext) {
	if (handleSingleLineComment({ ctx, openingSequence: '//' })) return
	if (handleMultiLineComment({ ctx, openingSequence: '/*', closingSequence: '*/' })) return
	if (handleDelimitedString({ ctx, openingSequence: "'", closingSequence: "'" })) return
	if (handleDelimitedString({ ctx, openingSequence: '"', closingSequence: '"' })) return
	if (handleJsTemplateString({ ctx })) return
}

function handleFencedCodeBlock({ ctx }: { ctx: ParsingContext }) {
	// If we encounter at least 3 backticks, we're potentially entering a fenced code block
	if (ctx.code.slice(ctx.i, ctx.i + 3) !== '```') return false
	// Get current line to ensure that there's only whitespace before the backticks
	// and retrieve the optional language identifier
	const range = getCurrentLineRange(ctx)
	const line = ctx.code.slice(range.start, range.end)
	const match = line.match(/^(?:\s*)(```+)\s*(\S+)?/)
	if (!match) return false
	const closingFence = match[1]
	const language = match[2] || 'plaintext'

	ctx.enterState({ parser: parseFencedCodeBlock, capturing: true })
	ctx.i = range.end - 1
	ctx.escaped = false
	ctx.enterState(getInitialStateByLanguage(language))

	return true

	function parseFencedCodeBlock(ctx: ParsingContext) {
		// If we encounter at least 3 backticks, we're potentially closing the fenced code block
		if (ctx.code.slice(ctx.i, ctx.i + 3) === '```') {
			// Get current line to ensure that there's only whitespace before and after the backticks
			const range = getCurrentLineRange(ctx)
			const line = ctx.code.slice(range.start, range.end)
			const match = line.match(/^(?:\s*)(```+)(?:\s*)$/)
			// The closing fence must have at least the same amount of backticks
			if (match && match[1].startsWith(closingFence)) {
				// Exit all nested states until we reach our initial fenced code block state
				while (ctx.currentState().parser !== parseFencedCodeBlock) ctx.exitState()
				// Exit this one as well
				ctx.exitState()
				ctx.i = range.end - 1
				return true
			}
		}
		return false
	}
}

function handleDelimitedString({
	ctx,
	openingSequence,
	closingSequence,
	escapeChar = '\\',
}: {
	ctx: ParsingContext
	openingSequence: string
	closingSequence: string
	escapeChar?: string | undefined
}) {
	const potentialOpening = ctx.code.slice(ctx.i, ctx.i + openingSequence.length)
	if (potentialOpening !== openingSequence) return false
	ctx.enterState({ parser: parseDelimitedString })
	return true

	function parseDelimitedString(ctx: ParsingContext) {
		const c = ctx.code[ctx.i]
		const potentialClosing = ctx.code.slice(ctx.i, ctx.i + closingSequence.length)
		if (potentialClosing === closingSequence && !ctx.escaped) {
			ctx.exitState()
			ctx.i += closingSequence.length - 1
		}
		ctx.escaped = c === escapeChar && !ctx.escaped
	}
}

function handleJsx({ ctx }: { ctx: ParsingContext }) {
	const braceStack: number[] = []
	const c = ctx.code[ctx.i]
	if (c === '{' && !ctx.escaped) {
		ctx.enterState({ parser: parseJsxExpression })
		return true
	}
	ctx.escaped = c === '\\' && !ctx.escaped
	return false

	function parseJsxExpression(ctx: ParsingContext) {
		const c = ctx.code[ctx.i]
		if (c === '{') {
			braceStack.push(ctx.i)
		} else if (c === '}') {
			if (braceStack.length > 0) braceStack.pop()
			if (braceStack.length === 0) return ctx.exitState()
		}
		parseBaseJsCode(ctx)
	}
}

function handleJsTemplateString({ ctx }: { ctx: ParsingContext }) {
	if (ctx.code[ctx.i] !== '`') return false
	const braceStack: number[] = []
	ctx.enterState({ parser: parseTemplateString })
	return true

	function parseTemplateString(ctx: ParsingContext) {
		const c = ctx.code[ctx.i]
		const next2 = ctx.code.slice(ctx.i, ctx.i + 2)
		if (c === '`' && !ctx.escaped) {
			ctx.exitState()
		} else if (next2 === '${') {
			ctx.enterState({ parser: parseTemplateExpression })
			braceStack.push(ctx.i)
			ctx.i += 1
		}
		ctx.escaped = c === '\\' && !ctx.escaped
	}

	function parseTemplateExpression(ctx: ParsingContext) {
		const c = ctx.code[ctx.i]
		if (c === '{') {
			braceStack.push(ctx.i)
		} else if (c === '}') {
			if (braceStack.length > 0) braceStack.pop()
			if (braceStack.length === 0) return ctx.exitState()
		}
		parseBaseJsCode(ctx)
	}
}

function handleSingleLineComment({ ctx, openingSequence }: { ctx: ParsingContext; openingSequence: string }) {
	return handleCommentStart({ ctx, openingSequence, targetState: { parser: parseSingleLineComment } })

	function parseSingleLineComment(ctx: ParsingContext) {
		if (ctx.code[ctx.i] === '\n' || ctx.i === ctx.code.length) {
			ctx.comments.push(
				createCommentFromRanges({
					fullCode: ctx.code,
					outerRange: { start: ctx.commentStart, end: ctx.i },
					contentRange: { start: ctx.commentContentStart, end: ctx.i },
					type: 'single',
				})
			)
			ctx.exitState()
		}
	}
}

function handleMultiLineComment({ ctx, openingSequence, closingSequence }: { ctx: ParsingContext; openingSequence: string | RegExp; closingSequence: string | RegExp }) {
	return handleCommentStart({ ctx, openingSequence, targetState: { parser: parseMultiLineComment } })

	function parseMultiLineComment(ctx: ParsingContext) {
		const match = matchAhead(ctx, closingSequence) || matchEof(ctx)
		if (match) {
			ctx.comments.push(
				createCommentFromRanges({
					fullCode: ctx.code,
					outerRange: { start: ctx.commentStart, end: match.start + match.length },
					contentRange: { start: ctx.commentContentStart, end: match.start },
					type: 'multi',
				})
			)
			ctx.exitState()
			ctx.i = match.start + match.length - 1
		}
	}
}

function handleCommentStart({ ctx, openingSequence, targetState }: { ctx: ParsingContext; openingSequence: string | RegExp; targetState: ParserState }) {
	const match = matchAhead(ctx, openingSequence)
	if (!match) return false
	ctx.enterState(targetState)
	ctx.commentStart = match.start
	ctx.commentContentStart = match.start + match.length
	ctx.i = ctx.commentContentStart - 1
	return true
}

function createCommentFromRanges({ fullCode, ...commentProps }: { fullCode: string } & Omit<Comment, 'outerText' | 'text'>): Comment {
	return {
		...commentProps,
		outerText: fullCode.slice(commentProps.outerRange.start, commentProps.outerRange.end),
		text: fullCode.slice(commentProps.contentRange.start, commentProps.contentRange.end),
	}
}

function matchAhead(ctx: ParsingContext, sequence: string | RegExp): { start: number; length: number } | undefined {
	if (sequence instanceof RegExp) {
		const searchWindow = ctx.code.slice(ctx.i, ctx.i + 40)
		const match = searchWindow.match(sequence)
		if (!match) return
		return {
			start: ctx.i + (match.index ?? 0),
			length: match[0].length,
		}
	}
	const searchWindow = ctx.code.slice(ctx.i, ctx.i + sequence.length)
	if (searchWindow !== sequence) return
	return {
		start: ctx.i,
		length: sequence.length,
	}
}

function matchEof(ctx: ParsingContext): { start: number; length: number } | undefined {
	if (ctx.i < ctx.code.length) return
	return {
		start: ctx.i,
		length: 0,
	}
}

function getCurrentLineRange(ctx: ParsingContext): { start: number; end: number } {
	const codeLength = ctx.code.length
	const range = { start: 0, end: codeLength }
	for (let i = ctx.i - 1; i >= 0; i--) {
		const c = ctx.code[i]
		if (c === '\n' || c === '\r') {
			range.start = i + 1
			break
		}
	}
	for (let i = ctx.i; i < codeLength; i++) {
		const c = ctx.code[i]
		if (c === '\n' || c === '\r') {
			range.end = i
			break
		}
	}
	return range
}
