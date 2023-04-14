import { BaseStylesResolverFn } from '../helpers/style-settings'
import { ExpressiveCodePluginHooks } from './plugin-hooks'

export interface ExpressiveCodePlugin {
	name: string
	/**
	 * The CSS styles that should be added to every page containing code blocks.
	 *
	 * All styles are scoped to Expressive Code by default, so they will not affect
	 * the rest of the page. SASS-like nesting is supported. If you want to add global styles,
	 * you can use the `@at-root` rule or target `:root`, `html` or `body` in your selectors.
	 *
	 * The engine's `getBaseStyles` function goes through all registered plugins
	 * and collects their base styles. If you provide a function instead of a string,
	 * the function is called with the current theme and the resolved core styles as an argument.
	 *
	 * The calling code must take care of actually adding the collected styles to the page.
	 * For example, it could create a site-wide CSS stylesheet from the base styles
	 * and insert a link to it, or it could insert the base styles into a `<style>` element.
	 */
	baseStyles?: string | BaseStylesResolverFn
	hooks: ExpressiveCodePluginHooks
}
