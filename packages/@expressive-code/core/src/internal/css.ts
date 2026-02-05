import postcss, { Root } from 'postcss'
import postcssNested from 'postcss-nested'
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

const preprocessor = postcss([
	// Prevent top-level selectors that are already scoped from being scoped twice
	(root: Root) => {
		const groupWrapperScope = `.${groupWrapperClassName}`
		root.walkRules((rule) => {
			if (rule.parent?.parent === root) {
				rule.selectors = rule.selectors.map((selector) => {
					if (selector.indexOf(groupWrapperScope) === 0) {
						return selector.slice(groupWrapperScope.length).trim() || '&'
					}
					return selector
				})
			}
		})
	},
	// Parse SASS-like nested selectors
	postcssNested(),
])
const processor = postcss([
	// Prevent selectors targeting the wrapper class name or top-level elements from being scoped
	(root: Root) => {
		const groupWrapperScope = escapeRegExp(`.${groupWrapperClassName}`)
		const regExpScopedTopLevel = new RegExp(`^${groupWrapperScope} .*(${groupWrapperScope}|:root|html|body)`, 'g')
		root.walkRules((rule) => {
			rule.selectors = rule.selectors.map((selector) => selector.replace(regExpScopedTopLevel, '$1'))
		})
	},
	// Apply some simple minifications
	(root: Root) => {
		// Remove whitespace after the last rule
		root.raws.after = ''
		// Discard comments
		root.walkComments((comment) => {
			comment.remove()
		})
		// Process rules
		root.walkRules((rule) => {
			rule.selector = rule.selectors.join(',')
			rule.raws.before = rule.raws.before?.trim() || ''
			rule.raws.between = ''
			rule.raws.after = ''
			rule.raws.semicolon = false
		})
		// Process at-rules like `@media`
		root.walkAtRules((atRule) => {
			atRule.raws.before = atRule.raws.before?.trim() || ''
			atRule.raws.between = ''
			atRule.raws.after = ''
		})
		// Process declarations
		root.walkDecls((decl) => {
			decl.raws.before = decl.raws.before?.trim() || ''
			/* c8 ignore next */
			decl.raws.between = decl.raws.between?.trim() || ':'
			decl.raws.value = {
				value: decl.value,
				raw: decl.raws.value?.raw.trim() ?? decl.value.trim(),
			}
		})
	},
])

export async function scopeAndMinifyNestedCss(css: string): Promise<string> {
	// @ts-expect-error PostCSS has incorrect types when using exactOptionalPropertyTypes
	const postCssOptions: { from?: string } = { from: undefined }

	// Scope and parse the styles
	const root = postcss.parse(`.${groupWrapperClassName}{${css}}`, postCssOptions)

	// Preprocess the parsed root node
	const preprocessedStyles = await preprocessor.process(root, postCssOptions)

	// Process the preprocessed result (the root node is still the same)
	const processedStyles = await processor.process(preprocessedStyles, postCssOptions)

	return processedStyles.css
}

export type PluginStyles = { pluginName: string; styles: string }

const processedStylesCache = new Map<string, string>()

/**
 * Processes the CSS styles added by plugins:
 * - Deduplicates the styles.
 * - Ensures that all selectors are scoped, unless they target the root element, html or body.
 * - Minifies the CSS.
 */
export async function processPluginStyles(pluginStyles: PluginStyles[]): Promise<Set<string>> {
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
			const processedCss = await scopeAndMinifyNestedCss(styles)
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
