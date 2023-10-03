import { ResolvedCoreStyles } from '../common/core-styles'
import { ResolverContext } from '../common/plugin'
import { StyleOverrides } from '../common/styling'
import { ExpressiveCodeTheme } from '../common/theme'
import { kebabCase } from './string-processing'

/**
 * Represents a strongly typed set of style settings provided by a plugin (or core).
 *
 * The constructor expects an object with a `defaultSettings` property. This property must contain
 * the default values for all settings and will be made available as a public instance property.
 * Allowed default value types are plain values (e.g. strings), an array of two values
 * to provide a dark and light variant, or resolver functions that return one of these types.
 *
 * It also expects a `styleOverridesSubpath` property that defines the subpath
 * under which the plugin's style overrides can be found in the engine config's
 * `styleOverrides` property.
 *
 * If you are writing a plugin that provides style overrides, please merge your style overrides
 * into the `StyleOverrides` interface declaration provided by the `@expressive-code/core` module,
 * using the same subpath as you defined in the `styleOverridesSubpath` property. You can see an
 * example of this below.
 *
 * As a plugin author, you should also assign an instance of this class to your plugin's
 * `styleSettings` property. This allows the engine to automatically declare CSS variables
 * for your style settings in all theme variants defined in the config.
 *
 * To consume the CSS variables in your plugin's `baseStyles` or anywhere else, see the
 * {@link var `var()`} method to get a CSS variable reference to any style setting.
 *
 * If CSS variables should not be generated for some of your style settings, you can exclude them
 * using the `cssVarExclusions` property of the object passed to the constructor.
 *
 * @example
 * const framesStyleSettings = new StyleSettings({
 *   styleOverridesSubpath: 'frames',
 *   defaultSettings: {
 *     fontFamily: 'sans-serif',
 *     fontSize: '1rem',
 *     minContrast: '5',
 *     titleBarForeground: ({ theme }) => theme.colors['editor.foreground'],
 *   },
 *   cssVarExclusions: ['minContrast'],
 * })
 *
 * // When using TypeScript: Merge your style overrides into the core StyleOverrides declaration
 * declare module '@expressive-code/core' {
 *   interface StyleOverrides {
 *     frames: Partial<typeof framesStyleSettings.defaultSettings>
 *   }
 * }
 *
 * // ↓↓↓
 *
 * framesStyleSettings.defaultSettings.fontFamily         // 'sans-serif'
 * framesStyleSettings.defaultSettings.fontSize           // '1rem'
 * framesStyleSettings.defaultSettings.minContrast        // '5'
 * framesStyleSettings.defaultSettings.titleBarForeground // ({ theme }) => theme.colors['editor.foreground']
 */
export class StyleSettings<T extends StyleSettingsConstraint<T>> {
	readonly styleOverridesSubpath: string
	readonly defaultSettings: UnresolvedStyleSettings<T>
	readonly cssVarExclusions: (keyof T)[]
	private readonly cssVarNames: Map<keyof T, string>

	constructor({
		styleOverridesSubpath,
		defaultSettings,
		cssVarExclusions = [],
	}: {
		styleOverridesSubpath: string
		defaultSettings: StyleSettings<T>['defaultSettings']
		cssVarExclusions?: (keyof T)[] | undefined
	}) {
		this.styleOverridesSubpath = styleOverridesSubpath
		this.defaultSettings = defaultSettings
		this.cssVarExclusions = cssVarExclusions

		// Generate CSS variable names for all non-excluded style settings
		this.cssVarNames = new Map()
		for (const styleSettingName in defaultSettings) {
			if (cssVarExclusions.includes(styleSettingName as keyof T)) continue
			const settingPath = (styleOverridesSubpath ? styleOverridesSubpath + '.' : '') + styleSettingName
			this.cssVarNames.set(styleSettingName, '--ec-' + kebabCase(settingPath))
		}
	}

	/**
	 * Returns a CSS variable reference for the given style setting. The CSS variable name is
	 * automatically generated based on the `styleOverridesSubpath` and the given setting name.
	 *
	 * You can optionally pass a fallback value to the CSS `var()` function call
	 * (e.g. `var(--ec-xyz, fallbackValue)`) in case the referenced variable is not defined or
	 * unsupported. However, this should rarely be the case as the engine automatically generates
	 * CSS variables for all style settings if the plugin's `styleSettings` property is set to
	 * an instance of this class.
	 *
	 * @example
	 * // (Continuing with the instance created in the class usage example)
	 * framesStyleSettings.var('fontSize')
	 * // ↓↓↓
	 * 'var(--ec-frames-font-size)'
	 */
	var(styleSetting: keyof T, fallbackValue?: string) {
		const varName = this.cssVarNames.get(styleSetting)
		if (!varName) throw new Error(`var() failed to find a CSS variable for style setting "${styleSetting as string}". All referenced settings must exist and not be excluded.`)
		return `var(${varName}${fallbackValue ? `, ${fallbackValue}` : ''})`
	}

	/**
	 * Generates CSS variable declarations by calling {@link resolve `resolve()`} with the given
	 * config (which includes `theme`, `styleOverrides` etc.), filtering out any settings excluded
	 * from CSS variable output by `cssVarExclusions`, and finally returning key-value pairs
	 * that use CSS variable names as keys.
	 *
	 * **Note**: You normally don't need to call this method yourself. If you assign an instance
	 * of the `StyleSettings` class to your plugin's `styleSettings` property, the engine will
	 * call it once per theme and config to declare CSS variables for all defined variants.
	 *
	 * @example
	 * // (Continuing with the instance created in the class usage example)
	 * framesStyleSettings.getCssVariablesForCurrentConfig({
	 *   theme: new ExpressiveCodeTheme({ ... }),
	 *   styleOverrides: {
	 *     frames: {
	 *       fontSize: '2rem',
	 *       titleBarForeground: ({ theme }) => theme.colors['menu.foreground'],
	 *     },
	 *   }
	 * })
	 * // ↓↓↓
	 * {
	 *   '--ec-frames-font-family': 'sans-serif',      // default style (as passed to the constructor earlier)
	 *   '--ec-frames-font-size': '2rem',              // style override (plain string)
	 *   '--ec-frames-title-bar-foreground': '#f0f0f0' // style override (return value of resolver function)
	 * }
	 */
	getCssVariablesForCurrentConfig(config: { theme: ExpressiveCodeTheme; coreStyles: ResolvedCoreStyles; styleOverrides: Partial<StyleOverrides> | undefined }): {
		[cssVarName: string]: string
	} {
		const resolvedSettings = this.resolve(config)

		// TODO: Map the resolved values to CSS variable names, but maybe extract the code above
		//       into a separate function first, so that it can be used to get coreStyles?
		return resolvedSettings
	}

	/**
	 * Resolves all style settings to their values under the given config (which includes `theme`,
	 * `styleOverrides` etc.), and returns key-value pairs using the setting names as keys.
	 *
	 * To generate the values, any style overrides are extracted from the `styleOverridesSubpath`
	 * of the theme and engine config, merged with the `defaultSettings`, and any resolver
	 * functions are called until all values are resolved.
	 *
	 * @example
	 * // (Continuing with the instance created in the class usage example)
	 * framesStyleSettings.resolve({
	 *   theme: new ExpressiveCodeTheme({ ... }),
	 *   styleOverrides: {
	 *     fontSize: '2rem',
	 *     titleBarForeground: ({ theme }) => theme.colors['menu.foreground'],
	 *   }
	 * })
	 * // ↓↓↓
	 * {
	 *   fontFamily: 'sans-serif',     // default style (as passed to the constructor earlier)
	 *   fontSize: '2rem',             // style override (plain string)
	 *   titleBarForeground: '#f0f0f0' // style override (return value of resolver function)
	 * }
	 */
	resolve({
		theme,
		coreStyles,
		styleOverrides,
	}: {
		theme: ExpressiveCodeTheme
		coreStyles: ResolvedCoreStyles
		styleOverrides: Partial<StyleOverrides> | undefined
	}): ResolvedStyleSettings<T> {
		const attemptedToResolve = new Set<keyof T>()
		const finishedResolving = new Set<keyof T>()
		const resolvedSettings = {} as ResolvedStyleSettings<T>
		const defaultSettings = this.defaultSettings
		const resolverArgs = { theme, coreStyles, resolveSetting }

		const getStyleOverridesSubpath = (styleOverrides: Partial<StyleOverrides> | undefined) => {
			if (this.styleOverridesSubpath === '') {
				return styleOverrides as UnresolvedStyleSettings<T> | undefined
			}
			return styleOverrides?.[this.styleOverridesSubpath as keyof StyleOverrides] as UnresolvedStyleSettings<T> | undefined
		}
		const themeStyleOverridesSubpath = getStyleOverridesSubpath(theme.styleOverrides)
		const globalStyleOverridesSubpath = getStyleOverridesSubpath(styleOverrides)

		function resolveSetting<K extends keyof T>(propertyName: K) {
			let result = resolvedSettings[propertyName]
			if (result === undefined && !finishedResolving.has(propertyName)) {
				if (attemptedToResolve.has(propertyName)) throw new Error(`Circular dependency detected while resolving style setting '${propertyName as string}'`)
				attemptedToResolve.add(propertyName)

				const valueOrResolver = themeStyleOverridesSubpath?.[propertyName] || globalStyleOverridesSubpath?.[propertyName] || defaultSettings[propertyName]
				const resolvedDefinition = (typeof valueOrResolver === 'function' ? valueOrResolver(resolverArgs) : valueOrResolver) as StyleValueOrValues<typeof result>
				result = Array.isArray(resolvedDefinition) ? resolvedDefinition[theme.type === 'dark' ? 0 : 1] : resolvedDefinition

				resolvedSettings[propertyName] = result
				finishedResolving.add(propertyName)
			}
			return result
		}

		for (const propertyName in defaultSettings) {
			resolveSetting(propertyName)
		}

		return resolvedSettings
	}
}

export type StyleSettingsConstraint<T> = {
	[K in keyof T]: unknown extends T[K] ? string : T[K]
}

export type StyleValueOrValues<ValueType> = ValueType | [dark: ValueType, light: ValueType]
export type CoreStyleResolverFn<T, ValueType> = ({
	theme,
	// We don't have a coreStyles object here yet
	resolveSetting,
}: {
	theme: ExpressiveCodeTheme
	resolveSetting: <K extends keyof T>(settingName: K) => T[K]
}) => StyleValueOrValues<ValueType>
export type StyleResolverFn<T, ValueType> = ({
	theme,
	coreStyles,
	resolveSetting,
}: {
	theme: ExpressiveCodeTheme
	coreStyles: ResolvedCoreStyles
	resolveSetting: <K extends keyof T>(settingName: K) => T[K]
}) => StyleValueOrValues<ValueType>
export type BaseStylesResolverFn = (context: ResolverContext) => string | Promise<string>
export type UnresolvedCoreStyleSettings<T> = { [K in keyof T]: StyleValueOrValues<T[K]> | CoreStyleResolverFn<T, T[K]> }
export type UnresolvedStyleSettings<T> = {
	[K in keyof T]: StyleValueOrValues<T[K]> | StyleResolverFn<T, T[K]>
}
export type ResolvedStyleSettings<T> = { [K in keyof T]: string }
