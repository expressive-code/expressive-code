import type { Atrule, Block, Declaration, Rule, Selector, StyleSheet } from '@eslint/css-tree'
import { fork } from './css-tree'
import { escapeRegExp } from './escaping'

export const groupWrapperElement = 'div'
export const groupWrapperClassName = 'expressive-code'

/**
 * A map of long terms commonly found in style setting paths to shorter alternatives that are
 * still human-readable. These replacements are automatically applied by {@link getCssVarName}
 * when generating CSS variable names to keep them fairly short.
 *
 * Plugins can add their own replacements to this map by adding a `cssVarReplacements` property
 * to their {@link PluginStyleSettings} object.
 */
export const cssVarReplacements = new Map<string, string>([
	['background', 'bg'],
	['foreground', 'fg'],
	['color', 'col'],
	['border', 'brd'],
	['padding', 'pad'],
	['margin', 'marg'],
	['radius', 'rad'],
	['opacity', 'opa'],
	['width', 'wd'],
	['height', 'ht'],
	['weight', 'wg'],
	['block', 'blk'],
	['inline', 'inl'],
	['bottom', 'btm'],
	['value', 'val'],
	['active', 'act'],
	['inactive', 'inact'],
	['highlight', 'hl'],
	['selection', 'sel'],
	['indicator', 'ind'],
	['shadow', 'shd'],
	['family', 'fml'],
	['transform', 'trf'],
	['decoration', 'dec'],
	['button', 'btn'],
	['editor', 'ed'],
	['terminal', 'trm'],
	['scrollbar', 'sb'],
	['toolbar', 'tb'],
	['gutter', 'gtr'],
	['titlebar', 'ttb'],
	['textMarkers', 'tm'],
	['frames', 'frm'],
])

const groupWrapperScope = `.${groupWrapperClassName}`
const escapedGroupWrapperScope = escapeRegExp(groupWrapperScope)
const regExpScopedTopLevel = new RegExp(`^${escapedGroupWrapperScope} .*(${escapedGroupWrapperScope}|:root|html|body)`)
const bubblingAtRules = new Set(['container', 'layer', 'media', 'scope', 'starting-style', 'supports'])
const keyframesAtRules = ['keyframes', '-moz-keyframes', '-webkit-keyframes']
const unwrappedAtRules = new Set(['document', 'font-face', 'page', ...keyframesAtRules])
const cssTree = fork((config) => {
	for (const name of ['container', 'scope', 'starting-style', 'supports']) {
		const atRule = config.atrule[name]
		if (!atRule) continue
		atRule.parse.block = function (isStyleBlock = false) {
			return this.Block(isStyleBlock, { allowNestedRules: true })
		}
	}
	for (const name of keyframesAtRules) {
		config.atrule[name] = {
			parse: {
				block() {
					return this.Block(false)
				},
			},
		}
	}
	return config
})
const { generate, parse, walk } = cssTree

export function validateCssDelimiters(css: string) {
	// css-tree recovers from unclosed delimiters, but plugin CSS should fail instead of being silently repaired.
	const stack: string[] = []
	let quote = ''
	let inComment = false

	for (let i = 0; i < css.length; i++) {
		const char = css[i]
		const next = css[i + 1]
		if (inComment) {
			if (char === '*' && next === '/') {
				inComment = false
				i++
			}
			continue
		}
		if (char === '\\') {
			i++
			continue
		}
		if (quote) {
			if (char === quote) quote = ''
			continue
		}
		if (char === '/' && next === '*') {
			inComment = true
			i++
			continue
		}
		if (char === '"' || char === "'") {
			quote = char
			continue
		}
		if (char === '(' || char === '[' || char === '{') {
			stack.push(char === '(' ? ')' : char === '[' ? ']' : '}')
		} else if (char === ')' || char === ']' || char === '}') {
			if (stack.pop() !== char) throw new Error(`Unexpected "${char}"`)
		}
	}

	if (inComment) throw new Error('Unclosed comment')
	if (quote) throw new Error('Unclosed string')
	if (stack.length) throw new Error(`Unclosed "${stack.at(-1)}"`)
}

function parseCss(source: string, context = 'stylesheet') {
	return parse(source, {
		context,
		positions: true,
		onParseError(error) {
			throw error
		},
	})
}

function getSourceText(node: { loc?: { start: { offset: number }; end: { offset: number } } | null }, source: string) {
	return node.loc ? source.slice(node.loc.start.offset, node.loc.end.offset) : ''
}

function generateDeclaration(declaration: Declaration, source: string) {
	const value = getSourceText(declaration.value, source).trim() || generate(declaration.value)
	return `${declaration.property}:${value}${declaration.important ? '!important' : ''}`
}

function getSelectors(prelude: Rule['prelude']): Selector[] {
	if (prelude.type === 'Raw') throw new Error(`Invalid selector "${prelude.value}"`)
	return [...prelude.children] as Selector[]
}

function selectorContainsNesting(selector: Selector) {
	let result = false
	walk(selector, {
		visit: 'NestingSelector',
		enter() {
			result = true
		},
	})
	return result
}

function generateSelector(selector: Selector, source: string, parentSelector?: string) {
	const sourceText = getSourceText(selector, source).trim() || generate(selector)
	if (!parentSelector || !selectorContainsNesting(selector)) return parentSelector ? `${parentSelector} ${sourceText}` : sourceText

	const replacements: { start: number; end: number }[] = []
	walk(selector, {
		visit: 'NestingSelector',
		enter(node) {
			if (node.loc && selector.loc) {
				replacements.push({ start: node.loc.start.offset - selector.loc.start.offset, end: node.loc.end.offset - selector.loc.start.offset })
			}
		},
	})
	return replacements.sort((a, b) => b.start - a.start).reduce((result, { start, end }) => `${result.slice(0, start)}${parentSelector}${result.slice(end)}`, sourceText)
}

function combineSelectors(parentSelectors: string[] | undefined, childPrelude: Rule['prelude'], source: string) {
	const childSelectors = getSelectors(childPrelude)
	if (!parentSelectors) return childSelectors.map((selector) => generateSelector(selector, source))

	const result: string[] = []
	for (const childSelector of childSelectors) {
		for (const parentSelector of parentSelectors) {
			const combined = generateSelector(childSelector, source, parentSelector)
			result.push(combined.replace(regExpScopedTopLevel, '$1'))
		}
	}
	return result
}

function generateAtRuleHeader(atRule: Atrule, source: string) {
	return `@${atRule.name}${atRule.prelude ? ` ${getSourceText(atRule.prelude, source).trim() || generate(atRule.prelude)}` : ''}`
}

function emitBlock(block: Block, source: string, parentSelectors?: string[]): string {
	let result = ''
	let declarations: Declaration[] = []
	const flushDeclarations = (hasFollowingChild = false) => {
		if (!declarations.length) return
		const contents = declarations.map((declaration) => generateDeclaration(declaration, source)).join(';')
		result += parentSelectors?.length ? `${parentSelectors.join(',')}{${contents}}` : contents
		if (!parentSelectors?.length && hasFollowingChild) result += ';'
		declarations = []
	}

	for (const child of block.children) {
		if (child.type === 'Comment') continue
		if (child.type === 'Declaration') {
			declarations.push(child)
			continue
		}
		flushDeclarations(true)

		if (child.type === 'Rule') {
			result += emitBlock(child.block, source, combineSelectors(parentSelectors, child.prelude, source))
			continue
		}
		if (child.type !== 'Atrule') throw new Error(`Unsupported CSS node "${child.type}"`)

		const header = generateAtRuleHeader(child, source)
		if (!child.block) {
			result += `${header};`
		} else if (child.name === 'at-root') {
			result += emitBlock(child.block, source)
		} else if (unwrappedAtRules.has(child.name)) {
			result += `${header}{${emitBlock(child.block, source)}}`
		} else if (bubblingAtRules.has(child.name)) {
			result += `${header}{${emitBlock(child.block, source, parentSelectors)}}`
		} else if (parentSelectors?.length) {
			result += `${parentSelectors.join(',')}{${header}{${emitBlock(child.block, source)}}}`
		} else {
			result += `${header}{${emitBlock(child.block, source)}}`
		}
	}
	flushDeclarations()
	return result
}

export function scopeAndMinifyNestedCss(css: string): string {
	validateCssDelimiters(css)
	const source = `${groupWrapperScope}{${css}}`
	const styleSheet = parseCss(source) as StyleSheet
	const wrapperRule = styleSheet.children.first
	if (wrapperRule?.type !== 'Rule') throw new Error('Failed to create CSS scope')
	return emitBlock(wrapperRule.block, source, [groupWrapperScope])
}

export type PluginStyles = { pluginName: string; styles: string }

const processedStylesCache = new Map<string, string>()

/**
 * Processes the CSS styles added by plugins:
 * - Deduplicates the styles.
 * - Ensures that all selectors are scoped, unless they target the root element, html or body.
 * - Minifies the CSS.
 */
export function processPluginStyles(pluginStyles: PluginStyles[]): Set<string> {
	const result = new Set<string>()
	const seenStyles = new Set<string>()

	for (const { pluginName, styles } of pluginStyles) {
		// Deduplicate the current set of styles
		if (seenStyles.has(styles)) continue
		seenStyles.add(styles)

		// Return cached result if the current styles have already been processed
		// in a previous call to this function with the same config class name
		const cacheKey = styles
		const cachedStyles = processedStylesCache.get(cacheKey)
		if (cachedStyles !== undefined) {
			result.add(cachedStyles)
			continue
		}

		try {
			// Scope the plugin styles to our group wrapper and minify them
			const processedCss = scopeAndMinifyNestedCss(styles)
			// Add the processed styles to the result
			result.add(processedCss)
			// Cache the processed styles
			processedStylesCache.set(cacheKey, processedCss)
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			throw new Error(`Plugin "${pluginName}" added CSS styles that could not be processed (error=${JSON.stringify(msg)}). Styles="${styles}"`)
		}
	}

	return result
}

/**
 * If `cascadeLayerName` is a non-empty string, wraps the given `css` styles
 * into a `@layer` rule with the given name.
 */
export function wrapInCascadeLayer(css: string, cascadeLayerName: string | undefined) {
	if (!cascadeLayerName || cascadeLayerName.trim() === '') return css
	return `@layer ${cascadeLayerName.trim()}{${css}}`
}
