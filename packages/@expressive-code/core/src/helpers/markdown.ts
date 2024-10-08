import type { Root, Parents, Element } from '../hast'
import { h } from '../hast'

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

export type MdToken = { type: MdType; text: string }

/*
You can nest syntaxes, e.g. **bold URLs like https://example.com** or ***bold & italic `inline code`***
*/

const parensAnyStyle = `()<>{}\\[\\]`
const nonParensAnyStyle = `[^\\s${parensAnyStyle}]`
const nonParensOrPunctuation = `[^\\s${parensAnyStyle}\`!;:'\\".,?«»“”‘’]`
const nonRoundParens = `[^\\s()]`
const balancedRoundParens = `\\([^\\s]+?\\)`
const balancedRoundParensNested = `\\(${nonRoundParens}*?\\(${nonRoundParens}+\\)${nonRoundParens}*?\\)`

export const urlRegExp = new RegExp(
	[
		`\\b`,
		// Capture #1: URL scheme, colon, and slashes
		`(https?:\\/{1,3})`,
		// Capture #2: Entire matched URL
		`(`,
		// Domain name or IP address
		`(?:[\\w.\\-]+)`,
		// Allow a slash, but not a @ here to avoid matching "foo.na" in "foo.na@example.com"
		`\\b`,
		`\\/?`,
		`(?!@)`,
		// Optional path and query string
		// Any sequence of:
		`(?:${nonParensAnyStyle}+|${balancedRoundParensNested}|${balancedRoundParens})*`,
		// Optionally ending with any of:
		`(?:${balancedRoundParensNested}|${balancedRoundParens}|${nonParensOrPunctuation})?`,
		// End of capture #2
		`)`,
	].join(''),
	'ig'
)

export function tokenizeMd(markdown: string): MdToken[] {
	const tokens: MdToken[] = []
	let currentText = ''

	const getSyntaxToken = (i: number): MdToken | undefined => {
		for (const { symbol, type } of syntaxTokens) {
			if (markdown.startsWith(symbol, i)) {
				return { type, text: symbol }
			}
		}
	}

	const addTextToken = () => {
		if (currentText) {
			tokens.push({ type: MdType.Text, text: currentText })
			currentText = ''
		}
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

function toTokens(type: MdType | undefined): MdToken[] {
	const token = type && syntaxTokens.find((token) => token.type === type)
	if (token) return [{ type, text: token.symbol }]
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

export function mdTokensToHast(tokens: MdToken[], allowAutolink = true): Root {
	const root = h(null)
	const p: Parents = root
	let plaintext = ''

	function findClosingIdx(openingIdx: number, closingTypes: MdType[], allowEscapes = true): number {
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

	function getTextContent(startIdx: number, endIdx: number): string {
		return tokens
			.slice(startIdx, endIdx)
			.map((token) => token.text)
			.join('')
	}

	function addChild(value: string | Element) {
		if (typeof value === 'string') {
			if (value.length) p.children.push({ type: 'text', value: value })
			return
		}
		finishPlaintext()
		p.children.push(value)
	}

	function finishPlaintext() {
		if (plaintext) {
			// Perform automatic link detection on plain text contents
			if (allowAutolink && plaintext.includes('http')) {
				const autolinkMatches = [...plaintext.matchAll(urlRegExp)]
				let lastIndex = 0
				autolinkMatches.forEach((match) => {
					addChild(plaintext.slice(lastIndex, match.index))
					p.children.push(h('a', { href: match[0] }, match[0]))
					lastIndex = match.index + match[0].length
				})
				plaintext = plaintext.slice(lastIndex)
			}
			addChild(plaintext)
			plaintext = ''
		}
	}

	let escaped = false
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]
		if (!escaped) {
			const formatHandler = formatHandlers.get(token.type)
			if (formatHandler) {
				const { closings, createNode, addContents, addAfter } = formatHandler
				const closingIdx = findClosingIdx(i, closings)
				if (closingIdx > -1) {
					const children = [...tokens.slice(i + 1, closingIdx), ...toTokens(addContents?.get(tokens[closingIdx].type))]
					addChild(createNode(mdTokensToHast(children)))
					tokens.splice(closingIdx + 1, 0, ...toTokens(addAfter?.get(tokens[closingIdx].type)))
					i = closingIdx
					continue
				}
			} else if (token.type === MdType.Code || token.type === MdType.DoubleCode) {
				const closingIdx = findClosingIdx(i, [token.type], false)
				if (closingIdx > -1) {
					let code = getTextContent(i + 1, closingIdx)
					if (code.startsWith(' `')) code = code.slice(1)
					if (code.endsWith('` ')) code = code.slice(0, -1)
					addChild(h('code', code))
					i = closingIdx
					continue
				}
			} else if (token.type === MdType.LinkTextStart) {
				const linkUrlStartIdx = findClosingIdx(i, [MdType.LinkUrlStart])
				const linkUrlEndIdx = linkUrlStartIdx > -1 ? findClosingIdx(linkUrlStartIdx, [MdType.LinkUrlEnd]) : -1
				if (linkUrlEndIdx > -1) {
					const linkText = mdTokensToHast(tokens.slice(i + 1, linkUrlStartIdx), false)
					const linkUrl = getTextContent(linkUrlStartIdx + 1, linkUrlEndIdx)
					addChild(h('a', { href: linkUrl }, linkText))
					i = linkUrlEndIdx
					continue
				}
			} else if (token.type === MdType.Escape) {
				escaped = true
				continue
			}
		}
		if (escaped) {
			// If we found an escape token before, but the current token did not need escaping,
			// add the escape token as plaintext
			if (token.type === MdType.Text) plaintext += '\\'
			escaped = false
		}

		plaintext += token.text
	}
	finishPlaintext()

	return root
}

export function mdToHast(markdown: string): Root {
	const tokens = tokenizeMd(markdown)

	return mdTokensToHast(tokens)
}
