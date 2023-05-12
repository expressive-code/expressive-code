import postcss, { Root } from 'postcss'
import postcssNested from 'postcss-nested'
import { escapeRegExp } from './escaping'

export const groupWrapperElement = 'div'
export const groupWrapperClassName = 'expressive-code'

// Support attaching processing data to root nodes
const processingData = new WeakMap<Root, { configClassName: string }>()
const getScopeSelector = (root: Root): string => `.${processingData.get(root)?.configClassName || groupWrapperClassName}`

const preprocessor = postcss([
	// Prevent top-level selectors that are already scoped from being scoped twice
	(root: Root) => {
		const scopeSelector = getScopeSelector(root)
		root.walkRules((rule) => {
			if (rule.parent?.parent === root) {
				rule.selectors = rule.selectors.map((selector) => {
					if (selector.indexOf(scopeSelector) === 0) {
						return selector.slice(scopeSelector.length).trim() || '&'
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
		const scopeSelector = getScopeSelector(root)
		const regExpScopedTopLevel = new RegExp(`^${escapeRegExp(scopeSelector)} .*(${escapeRegExp(`.${groupWrapperClassName}`)}|:root|html|body)`, 'g')
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
			rule.walkDecls((decl) => {
				decl.raws.before = decl.raws.before?.trim() || ''
				/* c8 ignore next */
				decl.raws.between = decl.raws.between?.trim() || ':'
				if (decl.raws.value !== undefined) {
					decl.raws.value.raw = decl.raws.value.raw.trim()
				}
			})
		})
		// Process at-rules like `@media`
		root.walkAtRules((atRule) => {
			atRule.raws.before = atRule.raws.before?.trim() || ''
			atRule.raws.between = ''
			atRule.raws.after = ''
		})
	},
])

export type PluginStyles = { pluginName: string; styles: string }

const processedStylesCache = new Map<string, string>()

/**
 * Processes the CSS styles added by plugins:
 * - Deduplicates the styles.
 * - Ensures that all selectors are scoped, unless they target the root element, html or body.
 * - Minifies the CSS.
 */
export async function processPluginStyles({ pluginStyles, configClassName }: { pluginStyles: PluginStyles[]; configClassName: string }): Promise<Set<string>> {
	const result = new Set<string>()
	const seenStyles = new Set<string>()
	const postCssOptions = { from: undefined }

	for (const { pluginName, styles } of pluginStyles) {
		// Deduplicate the current set of styles
		if (seenStyles.has(styles)) continue
		seenStyles.add(styles)

		// Return cached result if the current styles have already been processed
		// in a previous call to this function with the same config class name
		// (this is useful because plugins tend to add the same styles for every block)
		const cacheKey = `${configClassName}::${styles}`
		const cachedStyles = processedStylesCache.get(cacheKey)
		if (cachedStyles !== undefined) {
			result.add(cachedStyles)
			continue
		}

		try {
			// Parse the styles and attach processing data to the root node for use by plugins
			const root = postcss.parse(`.${configClassName}{${styles}}`, postCssOptions)
			processingData.set(root, { configClassName })

			// Preprocess the parsed root node
			const preprocessedStyles = await preprocessor.process(root, postCssOptions)

			// Process the preprocessed result (the root node is still the same)
			const processedStyles = await processor.process(preprocessedStyles, postCssOptions)

			// Add the processed styles to the result
			result.add(processedStyles.css)

			// Cache the processed styles
			processedStylesCache.set(cacheKey, processedStyles.css)
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			throw new Error(`Plugin "${pluginName}" added CSS styles that could not be processed (error=${JSON.stringify(msg)}). Styles="${styles}"`)
		}
	}

	return result
}
