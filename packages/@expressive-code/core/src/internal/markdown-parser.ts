import type { Root, Parents, Element } from '../hast'
import { h } from '../hast'
import { autolinkRegExp } from '../internal/autolink'
import { createTokens, MdToken, MdType } from './markdown-tokenizer'

const defineFormat = (closings: MdType[], createNode: (children: Root | Parents[]) => Element, addContents?: [MdType, MdType][], addAfter?: [MdType, MdType][]) => ({
	closings,
	createNode,
	addContents: addContents ? new Map(addContents) : undefined,
	addAfter: addAfter ? new Map(addAfter) : undefined,
})

const formatHandlers = new Map<MdType, ReturnType<typeof defineFormat>>([
	[MdType.Italic, defineFormat([MdType.Italic, MdType.BoldItalic], (children) => h('em', children), [[MdType.BoldItalic, MdType.Bold]])],
	[MdType.Bold, defineFormat([MdType.Bold, MdType.BoldItalic], (children) => h('b', children), [[MdType.BoldItalic, MdType.Italic]])],
	[
		MdType.BoldItalic,
		defineFormat([MdType.Italic, MdType.Bold, MdType.BoldItalic], (children) => h('b', h('em', children)), undefined, [
			[MdType.Italic, MdType.Bold],
			[MdType.Bold, MdType.Italic],
		]),
	],
])

/**
 * A parser that converts inline Markdown tokens to a HAST tree.
 */
export function inlineMarkdownTokensToHast(tokens: MdToken[], allowAutolink = true): Root {
	const root = h(null)
	const p: Parents = root
	let text = ''
	let unmatchedEscapes: number[] = []
	let escaped = false
	let i = 0

	function addText(value: string) {
		if (value.length) p.children.push({ type: 'text', value: value })
	}

	function finishText() {
		if (!text) return
		handleAutolinks()
		addText(text)
		text = ''
		unmatchedEscapes = []
	}

	function addChild(value: Element) {
		finishText()
		p.children.push(value)
	}

	function handleFormatting() {
		const formatHandler = formatHandlers.get(tokens[i].type)
		if (!formatHandler) return
		// The start of an italic sequence may not be followed by a space
		if (tokens[i].type === MdType.Italic && !tokens[i].created && tokens[i + 1]?.text.startsWith(' ')) return
		const { closings, createNode, addContents, addAfter } = formatHandler
		const closingIdx = findClosingIdx(tokens, i, closings)
		if (closingIdx === -1) return
		// The end of an italic sequence may not have 3+ spaces before it
		if (tokens[closingIdx].type === MdType.Italic && tokens[closingIdx - 1]?.text.endsWith('   ')) return
		const children = [...tokens.slice(i + 1, closingIdx), ...createTokens(addContents?.get(tokens[closingIdx].type))]
		addChild(createNode(inlineMarkdownTokensToHast(children)))
		tokens.splice(closingIdx + 1, 0, ...createTokens(addAfter?.get(tokens[closingIdx].type)))
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
			const linkText = inlineMarkdownTokensToHast(tokens.slice(i + 1, linkUrlStartIdx), false)
			const linkUrl = getTextContent(tokens, linkUrlStartIdx + 1, linkUrlEndIdx)
			addChild(h('a', { href: linkUrl }, linkText))
			i = linkUrlEndIdx
			return true
		}
	}

	function handleAutolinks() {
		if (allowAutolink && text.includes('http')) {
			const autolinkMatches = [...text.matchAll(autolinkRegExp)]
			if (!autolinkMatches.length) return
			let lastIndex = 0
			autolinkMatches.forEach((match) => {
				// Allow escaping of autolinks
				if (unmatchedEscapes.includes(match.index - 1)) {
					addText(text.slice(lastIndex, match.index - 1))
					lastIndex = match.index
					return
				}
				addText(text.slice(lastIndex, match.index))
				p.children.push(h('a', { href: match[0] }, match[0]))
				lastIndex = match.index + match[0].length
			})
			text = text.slice(lastIndex)
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
				unmatchedEscapes.push(text.length)
				text += '\\'
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

		text += tokens[i].text
	}
	finishText()

	return root
}

function findClosingIdx(tokens: MdToken[], openingIdx: number, closingTypes: MdType[], allowEscapes = true) {
	for (let i = openingIdx + 1; i < tokens.length; i++) {
		if (tokens[i].type === MdType.Escape && allowEscapes) i += 2
		if (closingTypes.includes(tokens[i]?.type)) return i
	}
	return -1
}

function getTextContent(tokens: MdToken[], startIdx: number, endIdx: number) {
	return tokens
		.slice(startIdx, endIdx)
		.map((token) => token.text)
		.join('')
}
