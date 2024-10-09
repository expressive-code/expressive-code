import type { Root, Parents, Element } from '../hast'
import { h } from '../hast'
import { autolinkRegExp } from '../internal/autolink'

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
	AutolinkUrl,
}

export type MdToken = { type: MdType; text: string; modified?: boolean | undefined }

const syntaxTokens: { symbol: string; type: MdType }[] = [
	{ symbol: '\\', type: MdType.Escape },
	{ symbol: '***', type: MdType.BoldItalic },
	{ symbol: '**', type: MdType.Bold },
	{ symbol: '*', type: MdType.Italic },
	{ symbol: '``', type: MdType.DoubleCode },
	{ symbol: '`', type: MdType.Code },
	{ symbol: '[', type: MdType.LinkTextStart },
	{ symbol: '](', type: MdType.LinkUrlStart },
	{ symbol: ')', type: MdType.LinkUrlEnd },
]

function injectTokens(type: MdType | undefined): MdToken[] {
	const token = type && syntaxTokens.find((token) => token.type === type)
	if (token) return [{ type, text: token.symbol, modified: true }]
	return []
}

type CreateNode = (children: Root | Parents[]) => Element

const formatHandlers = new Map<
	MdType,
	{
		closings: MdType[]
		createNode: CreateNode
		addContents?: Map<MdType, MdType> | undefined
		addAfter?: Map<MdType, MdType> | undefined
	}
>([
	[
		MdType.Italic,
		{
			closings: [MdType.Italic, MdType.BoldItalic],
			createNode: (children) => h('em', children),
			addContents: new Map([[MdType.BoldItalic, MdType.Bold]]),
		},
	],
	[
		MdType.Bold,
		{
			closings: [MdType.Bold, MdType.BoldItalic],
			createNode: (children) => h('b', children),
			addContents: new Map([[MdType.BoldItalic, MdType.Italic]]),
		},
	],
	[
		MdType.BoldItalic,
		{
			closings: [MdType.Italic, MdType.Bold, MdType.BoldItalic],
			createNode: (children) => h('b', h('em', children)),
			addAfter: new Map([
				[MdType.Italic, MdType.Bold],
				[MdType.Bold, MdType.Italic],
			]),
		},
	],
])

function findClosingIdx(tokens: MdToken[], openingIdx: number, closingTypes: MdType[], allowEscapes = true): number {
	let escaped = false
	for (let i = openingIdx + 1; i < tokens.length; i++) {
		if (escaped) {
			escaped = false
			continue
		}
		const token = tokens[i]
		if (!escaped && token.type === MdType.Escape && allowEscapes) {
			escaped = true
			continue
		}
		if (closingTypes.includes(token.type)) return i
	}
	return -1
}

function getTextContent(tokens: MdToken[], startIdx: number, endIdx: number): string {
	return tokens
		.slice(startIdx, endIdx)
		.map((token) => token.text)
		.join('')
}

function tokenizeMd(markdown: string): MdToken[] {
	const tokens: MdToken[] = []
	let currentText = ''

	function getSyntaxToken(i: number): MdToken | undefined {
		for (const { symbol, type } of syntaxTokens) {
			if (markdown.startsWith(symbol, i)) {
				return { type, text: symbol }
			}
		}
	}

	function addTextToken() {
		if (!currentText) return
		tokens.push({ type: MdType.Text, text: currentText })
		currentText = ''
	}

	let i = 0
	while (i < markdown.length) {
		const token = getSyntaxToken(i)
		if (token) {
			addTextToken()
			tokens.push(token)
			i += token.text.length
			continue
		}
		currentText += markdown[i]
		i += 1
	}

	addTextToken()

	return tokens
}

function mdTokensToHast(tokens: MdToken[], allowAutolink = true): Root {
	const root = h(null)
	const p: Parents = root
	let plaintext = ''
	let unmatchedEscapes: number[] = []
	let escaped = false
	let i = 0

	function addText(value: string) {
		if (value.length) p.children.push({ type: 'text', value: value })
	}

	function finishPlaintext() {
		if (!plaintext) return
		handleAutolinks()
		addText(plaintext)
		plaintext = ''
		unmatchedEscapes = []
	}

	function addChild(value: Element) {
		finishPlaintext()
		p.children.push(value)
	}

	function handleFormatting() {
		const formatHandler = formatHandlers.get(tokens[i].type)
		if (!formatHandler) return
		// The start of an italic sequence may not be followed by a space
		if (tokens[i].type === MdType.Italic && !tokens[i].modified && tokens[i + 1]?.text.startsWith(' ')) return
		const { closings, createNode, addContents, addAfter } = formatHandler
		const closingIdx = findClosingIdx(tokens, i, closings)
		if (closingIdx === -1) return
		// The end of an italic sequence may not have 3+ spaces before it
		if (tokens[closingIdx].type === MdType.Italic && tokens[closingIdx - 1]?.text.endsWith('   ')) return
		const children = [...tokens.slice(i + 1, closingIdx), ...injectTokens(addContents?.get(tokens[closingIdx].type))]
		addChild(createNode(mdTokensToHast(children)))
		tokens.splice(closingIdx + 1, 0, ...injectTokens(addAfter?.get(tokens[closingIdx].type)))
		i = closingIdx
		return true
	}

	function handleCode() {
		if (![MdType.Code, MdType.DoubleCode].includes(tokens[i].type)) return
		const closingIdx = findClosingIdx(tokens, i, [tokens[i].type], false)
		if (closingIdx === -1) return
		let code = getTextContent(tokens, i + 1, closingIdx)
		if (code.startsWith(' `')) code = code.slice(1)
		if (code.endsWith('` ')) code = code.slice(0, -1)
		addChild(h('code', code))
		i = closingIdx
		return true
	}

	function handleMdLink() {
		if (tokens[i].type !== MdType.LinkTextStart) return
		const linkUrlStartIdx = findClosingIdx(tokens, i, [MdType.LinkUrlStart])
		const linkUrlEndIdx = linkUrlStartIdx > -1 ? findClosingIdx(tokens, linkUrlStartIdx, [MdType.LinkUrlEnd]) : -1
		if (linkUrlEndIdx > -1) {
			const linkText = mdTokensToHast(tokens.slice(i + 1, linkUrlStartIdx), false)
			const linkUrl = getTextContent(tokens, linkUrlStartIdx + 1, linkUrlEndIdx)
			addChild(h('a', { href: linkUrl }, linkText))
			i = linkUrlEndIdx
			return true
		}
	}

	function handleAutolinks() {
		// Perform automatic link detection on plain text contents
		if (allowAutolink && plaintext.includes('http')) {
			const autolinkMatches = [...plaintext.matchAll(autolinkRegExp)]
			if (!autolinkMatches.length) return
			let lastIndex = 0
			autolinkMatches.forEach((match) => {
				// Allow escaping of autolinks
				if (unmatchedEscapes.includes(match.index - 1)) {
					addText(plaintext.slice(lastIndex, match.index - 1))
					lastIndex = match.index
					return
				}
				addText(plaintext.slice(lastIndex, match.index))
				p.children.push(h('a', { href: match[0] }, match[0]))
				lastIndex = match.index + match[0].length
			})
			plaintext = plaintext.slice(lastIndex)
			unmatchedEscapes = unmatchedEscapes.filter((idx) => idx >= lastIndex).map((idx) => idx - lastIndex)
		}
	}

	function handleEscape() {
		if (!escaped && tokens[i].type === MdType.Escape) {
			escaped = true
			return true
		}
		if (escaped) {
			// If we found an escape token before, but the current token did not need escaping,
			// add the escape token as plaintext
			if (tokens[i].type === MdType.Text) {
				unmatchedEscapes.push(plaintext.length)
				plaintext += '\\'
			}
			escaped = false
		}
	}

	for (; i < tokens.length; i++) {
		if (!escaped) {
			if (handleFormatting()) continue
			if (handleCode()) continue
			if (handleMdLink()) continue
		}
		if (handleEscape()) continue

		plaintext += tokens[i].text
	}
	finishPlaintext()

	return root
}

export function markdownToHast(markdown: string): Root {
	const tokens = tokenizeMd(markdown)

	return mdTokensToHast(tokens)
}
