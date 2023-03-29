import postcss from 'postcss'
import postcssPrefixWrap from 'postcss-prefixwrap'
import postcssDiscardComments from 'postcss-discard-comments'
import postcssMinifySelectors from 'postcss-minify-selectors'
import postcssNormalizeWhitespace from 'postcss-normalize-whitespace'

export const groupWrapperElement = 'div'
export const groupWrapperClass = '.expressive-code'
export const groupWrapperScope = groupWrapperElement + groupWrapperClass

const processor = postcss([
	// Scope CSS selectors added by plugins
	postcssPrefixWrap(groupWrapperScope, {
		// Ignore selectors that target the root element, html or body,
		// and avoid duplicating the wrapper class
		ignoredSelectors: [':root', 'html', 'body', groupWrapperScope],
	}),
	// Minify the CSS
	postcssDiscardComments({ removeAll: true }),
	postcssMinifySelectors(),
	postcssNormalizeWhitespace(),
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
			const postcssResult = await processor.process(styles, { from: undefined })
			result.add(postcssResult.css)
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			throw new Error(`Plugin "${pluginName}" added CSS styles that could not be processed (error=${JSON.stringify(msg)}). Styles=${JSON.stringify(styles)}`)
		}
	}
	return result
}
