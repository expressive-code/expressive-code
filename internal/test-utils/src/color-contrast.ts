import { visit } from 'unist-util-visit'
import { visitParents } from 'unist-util-visit-parents'
import { toText } from 'hast-util-to-text'
import { Element } from 'hast-util-to-text/lib'
import { Parent, StyleSettingPath, StyleVariant, getClassNames, getColorContrast, getStaticBackgroundColor, onBackground } from '@expressive-code/core'

export function validateColorContrast({ renderedGroupAst, styleVariants }: { renderedGroupAst: Parent; styleVariants: StyleVariant[] }) {
	const themesWithInsufficientContrast: string[] = []
	const expectedMinContrast = 4.5
	const linesInGroupAst = getLineNodes(renderedGroupAst)
	styleVariants.forEach((styleVariant, styleVariantIndex) => {
		// Calculate the contrast of all syntax tokens against their combined background colors
		const tokenColors: { text: string; bg: string; fg: string; contrast: number | undefined; lineIndex: number }[] = []
		visitParents(renderedGroupAst, 'element', (token, ancestors) => {
			// Only process spans with a style attribute
			if (token.tagName !== 'span') return
			const style = token.properties?.style?.toString()
			if (!style) return
			// Only process spans that have direct text contents
			if (!token.children.some((child) => child.type === 'text')) return
			// Determine the current foreground color by walking the ancestor chain
			// from the current token to the root and extracting the first foreground color
			// for the current style variant index
			const fg = getForegroundColor({ token, ancestors, styleVariant, styleVariantIndex })
			if (!fg) throw new Error(`Could not determine foreground color of token: ${style}`)
			// Determine the combined background color by walking the ancestor chain
			// from the root to the current token
			const bg = getBackgroundColor({ token, ancestors, styleVariant })
			const text = toText(token)
			const contrast = fg && bg ? getColorContrast(fg, bg) : undefined
			tokenColors.push({
				text,
				bg,
				fg,
				contrast,
				lineIndex: getLineIdx({ token, ancestors, linesInGroupAst }),
			})
		})

		const insufficientContrastTokens = tokenColors
			.filter((token) => token.text.trim() !== '' && (token.contrast === undefined || token.contrast < expectedMinContrast))
			.map(
				(token) =>
					`Line ${token.lineIndex + 1}, token: "${token.text}" (${[
						`fg: ${token.fg ?? 'undefined'}`,
						`bg: ${token.bg ?? 'undefined'}`,
						`contrast: ${token.contrast !== undefined ? Math.round(token.contrast * 10) / 10 : 'undefined'}`,
					].join(', ')})`
			)
			.join('\n')
		if (insufficientContrastTokens !== '') {
			themesWithInsufficientContrast.push(`*** Theme "${styleVariant.theme.name}" has insufficient contrast (expected ${expectedMinContrast}):\n${insufficientContrastTokens}`)
		}
	})
	if (themesWithInsufficientContrast.length > 0) {
		throw new Error(`Expected no themes with insufficient contrast, but found:\n\n${themesWithInsufficientContrast.join('\n\n')}\n\n`)
	}
}

function getResolvedColors(styleVariant: StyleVariant) {
	const getSetting = (setting: string) => {
		const value = styleVariant.resolvedStyleSettings.get(setting as StyleSettingPath)
		if (!value) throw new Error(`Could not extract ${setting} from style settings`)
		return value
	}
	return {
		codeFg: getSetting('codeForeground'),
		codeBg: getStaticBackgroundColor(styleVariant),
		markBg: getSetting('textMarkers.markBackground'),
		delBg: getSetting('textMarkers.delBackground'),
		insBg: getSetting('textMarkers.insBackground'),
	}
}

function getForegroundColor({ token, ancestors, styleVariant, styleVariantIndex }: { token: Parent; ancestors: Parent[]; styleVariant: StyleVariant; styleVariantIndex: number }) {
	const nodes = [...ancestors, token]
	for (let i = nodes.length - 1; i >= 0; i--) {
		const node = nodes[i]
		if (node.type !== 'element') continue
		if (node.tagName === 'span') {
			const style = node.properties?.style?.toString()
			if (style) {
				// Try to extract the foreground color of the current style variant index
				const fg = style.match(new RegExp(`(?:^|;)--${styleVariantIndex}:(#.*?)(?:;|$)`))?.[1]
				if (fg) return fg
			}
		}
	}
	// If no foreground color was found, return the default foreground color
	const colors = getResolvedColors(styleVariant)
	return colors.codeFg
}

function getBackgroundColor({ token, ancestors, styleVariant }: { token: Parent; ancestors: Parent[]; styleVariant: StyleVariant }) {
	const colors = getResolvedColors(styleVariant)
	let combinedBg = colors.codeBg
	const nodes = [...ancestors, token]
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]
		if (node.type !== 'element') continue
		const classes = getClassNames(node)
		let nodeBg: string | undefined = undefined
		if (node.tagName === 'div' && classes.includes('ec-line')) {
			if (classes.includes('mark')) nodeBg = colors.markBg
			if (classes.includes('del')) nodeBg = colors.delBg
			if (classes.includes('ins')) nodeBg = colors.insBg
		}
		if (node.tagName === 'mark') nodeBg = colors.markBg
		if (node.tagName === 'del') nodeBg = colors.delBg
		if (node.tagName === 'ins') nodeBg = colors.insBg

		if (nodeBg) {
			combinedBg = onBackground(nodeBg, combinedBg)
		}
	}
	return combinedBg
}

function getLineNodes(renderedGroupAst: Parent) {
	const linesInGroupAst: Element[] = []
	visit(renderedGroupAst, 'element', (node) => {
		if (node.tagName === 'div' && getClassNames(node).includes('ec-line')) {
			linesInGroupAst.push(node)
		}
	})
	return linesInGroupAst
}

function getLineIdx({ token, ancestors, linesInGroupAst }: { token: Parent; ancestors: Parent[]; linesInGroupAst: Element[] }) {
	const nodes = [...ancestors, token]
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]
		if (node.type !== 'element') continue
		const lineIdx = linesInGroupAst.indexOf(node)
		if (lineIdx > -1) return lineIdx
	}

	return -1
}
