import { ExpressiveCodePluginHooks } from './plugin-hooks'
import { PluginStyleSettings } from './plugin-style-settings'
import { StyleSettingPath } from './style-settings'
import { StyleVariant } from './style-variants'

/**
 * An interface that defines an Expressive Code plugin. To add a custom plugin,
 * you pass an object matching this interface into the `plugins` array property
 * of the engine configuration.
 */
export interface ExpressiveCodePlugin {
	/**
	 * The display name of the plugin. This is the only required property.
	 * It is used by the engine to display messages concerning the plugin,
	 * e.g. when it encounters an error.
	 */
	name: string
	/**
	 * An instance of `PluginStyleSettings` that is used to define the plugin's CSS variables.
	 */
	styleSettings?: PluginStyleSettings | undefined
	/**
	 * The CSS styles that should be added to every page containing code blocks.
	 *
	 * All styles are scoped to Expressive Code by default, so they will not affect
	 * the rest of the page. SASS-like nesting is supported. If you want to add global styles,
	 * you can use the `@at-root` rule or target `:root`, `html` or `body` in your selectors.
	 *
	 * The engine's `getBaseStyles` function goes through all registered plugins
	 * and collects their base styles.
	 *
	 * If you provide a function instead of a string, it is called with an object argument
	 * of type {@link ResolverContext}, and is expected to return a string or a string promise.
	 *
	 * The calling code must take care of actually adding the collected styles to the page.
	 * For example, it could create a site-wide CSS stylesheet from the base styles
	 * and insert a link to it, or it could insert the base styles into a `<style>` element.
	 */
	baseStyles?: string | BaseStylesResolverFn | undefined
	/**
	 * JavaScript modules (pure code without any wrapping `script` tags) that should be added
	 * to every page containing code blocks.
	 *
	 * The engine's `getJsModules` function goes through all registered plugins,
	 * collects their JS modules and deduplicates them.
	 *
	 * If you provide a function instead of a string, it is called with an object argument
	 * of type {@link ResolverContext}, and is expected to return a string or a string promise.
	 *
	 * The calling code must take care of actually adding the collected scripts to the page.
	 * For example, it could create site-wide JavaScript files from the returned modules
	 * and refer to them in a script tag with `type="module"`, or it could insert them
	 * into inline `<script type="module">` elements.
	 */
	jsModules?: string[] | JsModulesResolverFn | undefined
	/**
	 * A set of functions that should be called by the engine at specific points in the
	 * rendering process. See {@link ExpressiveCodePluginHooks} for a list of available hooks.
	 */
	hooks?: ExpressiveCodePluginHooks | undefined
}

export type BaseStylesResolverFn = (context: ResolverContext) => string | Promise<string>
export type JsModulesResolverFn = (context: ResolverContext) => string[] | Promise<string[]>

/**
 * A context object that the engine passes to most hook functions.
 *
 * It provides access to theme-dependent CSS variables, all resolved style variants
 * based on the configured themes and settings, and the config-dependent wrapper class name.
 */
export type ResolverContext = {
	/**
	 * Returns a CSS variable reference for the given style setting. The CSS variable name is
	 * automatically generated based on the setting path.
	 *
	 * You can optionally pass a fallback value that will be added to the CSS `var()` function call
	 * (e.g. `var(--ec-xyz, fallbackValue)`) in case the referenced variable is not defined or
	 * unsupported. However, this should rarely be the case as the engine automatically generates
	 * CSS variables for all style settings if the plugin's `styleSettings` property is set.
	 *
	 * @example
	 * cssVar('frames.fontSize')
	 * // ↓↓↓
	 * 'var(--ec-frames-fontSize)'
	 *
	 * cssVar('frames.fontSize', '2rem')
	 * // ↓↓↓
	 * 'var(--ec-frames-fontSize, 2rem)'
	 */
	cssVar: (styleSetting: StyleSettingPath, fallbackValue?: string) => string
	/**
	 * Returns the CSS variable name for the given style setting. The CSS variable name is
	 * automatically generated based on the setting path.
	 *
	 * @example
	 * cssVarName('frames.fontSize')
	 * // ↓↓↓
	 * '--ec-frames-fontSize'
	 */
	cssVarName: (styleSetting: StyleSettingPath) => string
	styleVariants: StyleVariant[]
}

/**
 * A utility function that helps you define an Expressive Code plugin.
 *
 * Using this function is recommended, but not required. It just passes through the given object,
 * but it also provides type information for your editor's auto-completion and type checking.
 *
 * @example
 * ```js
 * // your-plugin.mjs
 * import { definePlugin } from '@expressive-code/core'
 *
 * export function myCustomPlugin() {
 *   return definePlugin({
 *     name: 'My custom plugin',
 *     hooks: {
 *       // ...
 *     }
 *   })
 * }
 * ```
 */
export function definePlugin(plugin: ExpressiveCodePlugin) {
	return plugin
}
