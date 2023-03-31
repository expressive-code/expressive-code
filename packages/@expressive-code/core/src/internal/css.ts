import postcss, { Root } from 'postcss'
import postcssNested from 'postcss-nested'
import postcssPrefixWrap from 'postcss-prefixwrap'

export const groupWrapperElement = 'div'
export const groupWrapperClass = '.expressive-code'
export const groupWrapperScope = groupWrapperElement + groupWrapperClass

const preprocessor = postcss([
	// Allow targeting the group wrapper by using the `&` selector at the top level
	(root: Root) => {
		root.walkRules((rule) => {
			if (rule.selector === '&') {
				rule.selector = groupWrapperScope
			}
		})
	},
	// Parse SASS-like nested selectors
	postcssNested(),
])
const processor = postcss([
	// Scope CSS selectors added by plugins
	postcssPrefixWrap(groupWrapperScope, {
		// Ignore selectors that target the root element, html or body,
		// and avoid duplicating the wrapper class
		ignoredSelectors: [':root', 'html', 'body', groupWrapperScope],
	}),
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
		if (seenStyles.has(styles)) continue
		seenStyles.add(styles)
		try {
			const preprocessedStyles = (await preprocessor.process(styles, { from: undefined })).css
			const processedStyles = (await processor.process(preprocessedStyles, { from: undefined })).css
			result.add(processedStyles)
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			throw new Error(`Plugin "${pluginName}" added CSS styles that could not be processed (error=${JSON.stringify(msg)}). Styles="${styles}"`)
		}
	}
	return result
}
