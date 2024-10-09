export enum MdType {
	Text,
	Escape,
	Bold,
	Italic,
	BoldItalic,
	Code,
	DoubleCode,
	LinkTextStart,
	LinkUrlStart,
	LinkUrlEnd,
}

export type MdToken = { type: MdType; text: string; created?: boolean | undefined }

const syntaxByType = new Map<MdType, string>([
	[MdType.Escape, '\\'],
	[MdType.BoldItalic, '***'],
	[MdType.Bold, '**'],
	[MdType.Italic, '*'],
	[MdType.DoubleCode, '``'],
	[MdType.Code, '`'],
	[MdType.LinkTextStart, '['],
	[MdType.LinkUrlStart, ']('],
	[MdType.LinkUrlEnd, ')'],
])

export function tokenizeMarkdown(markdown: string): MdToken[] {
	const tokens: MdToken[] = []
	let text = ''

	function getSyntaxToken(col: number): MdToken | undefined {
		for (const [type, symbol] of syntaxByType) {
			if (markdown.startsWith(symbol, col)) return { type, text: symbol }
		}
	}

	function finishText() {
		if (!text) return
		tokens.push({ type: MdType.Text, text })
		text = ''
	}

	let i = 0
	while (i < markdown.length) {
		const token = getSyntaxToken(i)
		if (token) {
			finishText()
			tokens.push(token)
			i += token.text.length
			continue
		}
		text += markdown[i]
		i += 1
	}

	finishText()

	return tokens
}

export function createTokens(type: MdType | undefined): MdToken[] {
	const syntax = type && syntaxByType.get(type)
	return syntax ? [{ type, text: syntax, created: true }] : []
}
