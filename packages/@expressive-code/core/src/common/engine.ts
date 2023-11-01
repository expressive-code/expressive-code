import githubDark from 'shiki/themes/github-dark.json'
import githubLight from 'shiki/themes/github-light.json'
import { ExpressiveCodePlugin, ResolverContext } from './plugin'
import { renderGroup, RenderInput, RenderOptions } from '../internal/render-group'
import { ExpressiveCodeTheme } from './theme'
import { PluginStyles, scopeAndMinifyNestedCss, processPluginStyles } from '../internal/css'
import { getCoreBaseStyles, getCoreThemeStyles } from '../internal/core-styles'
import { StyleVariant, resolveStyleVariants } from './style-variants'
import { StyleOverrides, StyleSettingPath, getCssVarName } from './style-settings'

export interface ExpressiveCodeEngineConfig {
	/**
	 * The color themes that should be available for your code blocks.
	 *
	 * CSS variables will be generated for all themes, allowing to select the theme to display
	 * using CSS. If you specify one dark and one light theme, a `prefers-color-scheme` media query
	 * will also be generated by default. You can customize this to match your site's needs
	 * through the `useDarkModeMediaQuery` and `themeCssSelector` options.
	 *
	 * Defaults to the `github-dark` and `github-light` themes.
	 */
	themes?: ExpressiveCodeTheme[] | undefined
	// TODO: Implement this option
	/**
	 * Determines if CSS code should be generated that uses a `prefers-color-scheme` media query
	 * to automatically switch between light and dark themes based on the user's system preferences.
	 *
	 * Defaults to `true` if your `themes` option is set to one dark and one light theme
	 * (which is the default), and `false` otherwise.
	 */
	useDarkModeMediaQuery?: boolean | undefined
	/**
	 * Allows to customize the selector used to switch between multiple themes.
	 *
	 * The first theme defined in the `themes` option is considered the "base theme", which
	 * always generates a full set of CSS variables using the `:root` selector. This ensures
	 * that all required CSS variables are globally available.
	 *
	 * For all alternate themes, Expressive Code uses the following default CSS selector to
	 * override any CSS variables that differ from the base theme:
	 * `:root[data-theme='${theme.name}'] &, &[data-theme='${theme.name}']`
	 *
	 * This default selector allows you to switch between multiple themes on a global level
	 * by adding a `data-theme` attribute with the theme name to your `<html>` element,
	 * and/or on a code block group level by adding a `data-theme` attribute to any code block
	 * group. The `<html>` element attribute could be changed by your theme switcher.
	 *
	 * If your site's theme switcher requires a different approach (e.g. if it uses class names
	 * instead of a data attribute), you can customize the generated selectors using this option.
	 *
	 * If you want to prevent the generation of theme-specific CSS variables altogether,
	 * you can set this to `false` or return it from the function.
	 */
	themeCssSelector?: ((theme: ExpressiveCodeTheme) => string | false) | false | undefined
	/**
	 * This optional function is called once per theme during engine initialization
	 * with the loaded theme as its only argument.
	 *
	 * It allows customizing the loaded theme and can be used for various purposes:
	 * - You can change a theme's `name` property to influence its generated CSS class name
	 *   (e.g. `theme.name = 'dark'` will result in code blocks having the class `ec-theme-dark`).
	 * - You can create color variations of themes by using `theme.applyHueAndChromaAdjustments()`.
	 *
	 * You can optionally return an `ExpressiveCodeTheme` instance from this function to replace
	 * the theme provided in the configuration. This allows you to create a copy of the theme
	 * and modify it without affecting the original instance.
	 */
	customizeTheme?: ((theme: ExpressiveCodeTheme) => ExpressiveCodeTheme | void) | undefined
	/**
	 * Whether the theme is allowed to style the scrollbars. Defaults to `true`.
	 *
	 * If set to `false`, scrollbars will be rendered using the browser's default style.
	 *
	 * Note that you can override the individual scrollbar colors defined by the theme
	 * using the `styleOverrides` option.
	 */
	useThemedScrollbars?: boolean | undefined
	// TODO: Actually change the default of this option to `false`
	/**
	 * Whether the theme is allowed to style selected text. Defaults to `false`.
	 *
	 * By default, Expressive Code renders selected text in code blocks using the browser's
	 * default style to maximize accessibility. If you want your selections to be more colorful,
	 * you can set this option to `true` to allow using theme selection colors instead.
	 *
	 * Note that you can override the individual selection colors defined by the theme
	 * using the `styleOverrides` option.
	 */
	useThemedSelectionColors?: boolean | undefined
	/**
	 * An optional set of style overrides that can be used to customize the appearance of
	 * the rendered code blocks without having to write custom CSS.
	 *
	 * The root level of this nested object contains core styles like colors, fonts, paddings
	 * and more. Plugins can contribute their own style settings to this object as well.
	 * For example, if the `frames` plugin is enabled, you can override its `shadowColor` by
	 * setting `styleOverrides.frames.shadowColor` to a color value.
	 *
	 * If any of the settings are not given, default values will be used or derived from the theme.
	 *
	 * **Tip:** If your site uses CSS variables for styling, you can also use these overrides
	 * to replace any core style with a CSS variable reference, e.g. `var(--your-css-var)`.
	 */
	styleOverrides?: StyleOverrides | undefined
	/**
	 * The locale that should be used for text content. Defaults to `en-US`.
	 */
	defaultLocale?: string | undefined
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins?: (ExpressiveCodePlugin | ExpressiveCodePlugin[])[] | undefined

	/**
	 * @deprecated Efficient multi-theme support is now a core feature, so the `theme` option
	 * was deprecated in favor of the new array `themes`. Please migrate your existing config
	 * to use `themes` and ensure it is an array. If you only need a single theme, your `themes`
	 * array can contain just this one theme. However, please consider the benefits of providing
	 * multiple themes. See the `themes` option for more details.
	 */
	theme?: ExpressiveCodeTheme | undefined
}

export class ExpressiveCodeEngine {
	constructor(config: ExpressiveCodeEngineConfig) {
		// Transfer deprecated `theme` option to `themes` without triggering the deprecation warning
		const deprecatedConfig: ExpressiveCodeEngineConfig & { theme?: ExpressiveCodeTheme | undefined } = config
		if (deprecatedConfig.theme && !config.themes) {
			config.themes = Array.isArray(deprecatedConfig.theme) ? deprecatedConfig.theme : [deprecatedConfig.theme]
			delete deprecatedConfig.theme
		}
		this.themes = Array.isArray(config.themes) ? [...config.themes] : config.themes ? [config.themes] : [new ExpressiveCodeTheme(githubDark), new ExpressiveCodeTheme(githubLight)]
		this.themeCssSelector = config.themeCssSelector ?? ((theme) => `:root[data-theme='${theme.name}'] &, &[data-theme='${theme.name}']`)
		this.useThemedScrollbars = config.useThemedScrollbars ?? true
		this.useThemedSelectionColors = config.useThemedSelectionColors ?? true
		this.styleOverrides = { ...config.styleOverrides }
		this.defaultLocale = config.defaultLocale || 'en-US'
		this.plugins = config.plugins?.flat() || []

		// Allow customizing the loaded themes
		this.themes = this.themes.map((theme) => (config.customizeTheme && config.customizeTheme(theme)) || theme)

		// Resolve core styles based on the themes and style overrides
		this.styleVariants = resolveStyleVariants({
			themes: this.themes,
			styleOverrides: this.styleOverrides,
			plugins: this.plugins,
			cssVarName: getCssVarName,
		})
	}

	async render(input: RenderInput, options?: RenderOptions) {
		return await renderGroup({
			input,
			options,
			defaultLocale: this.defaultLocale,
			plugins: this.plugins,
			// Also pass resolved style variants in case plugins need them
			...this.getResolverContext(),
		})
	}

	/**
	 * Returns a string containing all CSS styles that should be added to every page
	 * using Expressive Code. These styles are static base styles which do not depend
	 * on the configured theme(s).
	 *
	 * The calling code must take care of actually adding the returned styles to the page.
	 *
	 * Please note that the styles contain references to CSS variables, which must also
	 * be added to the page. These can be obtained by calling {@link getThemeStyles}.
	 */
	async getBaseStyles(): Promise<string> {
		const pluginStyles: PluginStyles[] = []
		const resolverContext = this.getResolverContext()
		// Add core base styles
		pluginStyles.push({
			pluginName: 'core',
			styles: getCoreBaseStyles({
				...resolverContext,
				useThemedScrollbars: this.useThemedScrollbars,
				useThemedSelectionColors: this.useThemedSelectionColors,
			}),
		})
		// Add plugin base styles
		for (const plugin of this.plugins) {
			if (!plugin.baseStyles) continue
			const resolvedStyles = typeof plugin.baseStyles === 'function' ? await plugin.baseStyles(resolverContext) : plugin.baseStyles
			if (!resolvedStyles) continue
			pluginStyles.push({
				pluginName: plugin.name,
				styles: resolvedStyles,
			})
		}
		// Process styles (scoping, minifying, etc.)
		const processedStyles = await processPluginStyles(pluginStyles)
		return [...processedStyles].join('')
	}

	/**
	 * Returns a string containing theme-dependent styles that should be added to every page
	 * using Expressive Code. These styles contain CSS variable declarations that are generated
	 * automatically based on the configured {@link ExpressiveCodeEngineConfig.themes themes},
	 * {@link ExpressiveCodeEngineConfig.useDarkModeMediaQuery useDarkModeMediaQuery} and
	 * {@link ExpressiveCodeEngineConfig.themeCssSelector themeCssSelector} config options.
	 *
	 * The calling code must take care of actually adding the returned styles to the page.
	 *
	 * Please note that these styles must be added to the page together with the base styles
	 * returned by {@link getBaseStyles}.
	 */
	async getThemeStyles(): Promise<string> {
		const styles: string[] = []
		const renderDeclarations = (declarations: Map<string, string>) => [...declarations].map(([varName, varValue]) => `${varName}:${varValue}`).join(';')

		// Generate CSS styles for the first theme (the "base theme")
		const baseVars = this.styleVariants[0].cssVarDeclarations
		styles.push(await scopeAndMinifyNestedCss(`:root { ${renderDeclarations(baseVars)}; } ${getCoreThemeStyles(0)}`))

		// Unless disabled, also generate per-theme CSS styles
		if (this.themeCssSelector !== false) {
			for (let styleVariantIndex = 1; styleVariantIndex < this.styleVariants.length; styleVariantIndex++) {
				const styleVariant = this.styleVariants[styleVariantIndex]
				const themeSelector = this.themeCssSelector && this.themeCssSelector(styleVariant.theme)
				if (!themeSelector) continue

				const themeStyles: string[] = []

				// Add CSS variable declarations for any values that differ from the base theme
				const diffVars = new Map<string, string>()
				styleVariant.cssVarDeclarations.forEach((varValue, varName) => {
					if (baseVars.get(varName) !== varValue) {
						diffVars.set(varName, varValue)
					}
				})
				if (diffVars.size > 0) themeStyles.push(renderDeclarations(diffVars))

				// Add core theme styles
				themeStyles.push(getCoreThemeStyles(styleVariantIndex))

				styles.push(await scopeAndMinifyNestedCss(`${themeSelector} { ${themeStyles.join(';')} }`))
			}
		}
		return styles.join('')
	}

	/**
	 * Returns an array of JavaScript modules (pure core without any wrapping `script` tags)
	 * that should be added to every page containing code blocks.
	 *
	 * The contents are collected from the `jsModules` property of all registered plugins.
	 * Any duplicates are removed.
	 *
	 * The calling code must take care of actually adding the collected scripts to the page.
	 * For example, it could create site-wide JavaScript files from the returned modules
	 * and refer to them in a script tag with `type="module"`, or it could insert them
	 * into inline `<script type="module">` elements.
	 */
	async getJsModules(): Promise<string[]> {
		const jsModules = new Set<string>()
		for (const plugin of this.plugins) {
			const pluginModules = typeof plugin.jsModules === 'function' ? await plugin.jsModules(this.getResolverContext()) : plugin.jsModules
			pluginModules?.forEach((moduleCode) => {
				moduleCode = moduleCode.trim()
				if (moduleCode) jsModules.add(moduleCode)
			})
		}
		return [...jsModules]
	}

	private cssVar(styleSetting: StyleSettingPath, fallbackValue?: string) {
		return `var(${getCssVarName(styleSetting)}${fallbackValue ? `, ${fallbackValue}` : ''})`
	}

	private getResolverContext(): ResolverContext {
		return {
			cssVar: (styleSetting, fallbackValue) => this.cssVar(styleSetting, fallbackValue),
			cssVarName: getCssVarName,
			styleVariants: this.styleVariants,
		}
	}

	readonly themes: ExpressiveCodeTheme[]
	readonly themeCssSelector: NonNullable<ExpressiveCodeEngineConfig['themeCssSelector']>
	readonly styleOverrides: StyleOverrides
	readonly styleVariants: StyleVariant[]
	readonly defaultLocale: string
	readonly useThemedScrollbars: boolean
	readonly useThemedSelectionColors: boolean
	readonly plugins: readonly ExpressiveCodePlugin[]
}
