import postcss from 'postcss'
import postcssPrefixWrap from 'postcss-prefixwrap'

export const groupWrapperElement = 'div'
export const groupWrapperClass = '.expressive-code'
export const groupWrapperScope = groupWrapperElement + groupWrapperClass

const processor = postcss()
	// Add PostCSS plugin to scope CSS selectors added by plugins
	.use(
		postcssPrefixWrap(groupWrapperScope, {
			// Ignore selectors that target the root element, html or body,
			// and avoid duplicating the wrapper class
			ignoredSelectors: [':root', 'html', 'body', groupWrapperScope],
		})
	)

/**
 * Processes the CSS styles added by plugins. Ensures that all selectors are scoped,
 * unless they target the root element, html or body.
 */
export function processStyles(css: string) {
	return processor.process(css).css
}
