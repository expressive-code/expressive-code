import { ResolvedCoreStyles, StyleOverrides } from '../common/core-styles'
import { ResolverContext } from '../common/plugin'
import { ExpressiveCodeTheme } from '../common/theme'

/**
 * Represents a strongly typed set of style settings that can be used in plugins.
 *
 * The setting property names are taken from the default styles passed to the constructor.
 * The values can either be plain strings or resolver functions that return a string.
 *
 * The passed default style settings are made available as a public property.
 *
 * Call the `resolve()` method to get a resolved style settings object
 * that can be used when generating CSS styles.
 *
 * @example
 * const framesStyleSettings = new StyleSettings({
 *   fontFamily: 'sans-serif',
 *   fontSize: '1rem',
 *   titleBarForeground: ({ theme }) => theme.colors['editor.foreground'],
 * })
 * // ↓↓↓
 * framesStyleSettings.defaultSettings.fontFamily         // 'sans-serif'
 * framesStyleSettings.defaultSettings.fontSize           // '1rem'
 * framesStyleSettings.defaultSettings.titleBarForeground // ({ theme }) => theme.colors['editor.foreground']
 */
export class StyleSettings<T> {
	readonly defaultSettings: UnresolvedStyleSettings<T>
	readonly styleOverridesSubpath: string

	constructor({ defaultSettings, styleOverridesSubpath }: { defaultSettings: StyleSettings<T>['defaultSettings']; styleOverridesSubpath: string }) {
		this.defaultSettings = defaultSettings
		this.styleOverridesSubpath = styleOverridesSubpath
	}

	/**
	 * Takes an object with the properties `theme` and optional `styleOverrides` as input.
	 * If any `styleOverrides` are defined, they will be used to override the default styles
	 * during resolving.
	 *
	 * If any of the default styles or style overrides are not strings, but resolver functions,
	 * they will be called with the given `theme` object as a property and are expected to
	 * return a string which is used as the resolved property value.
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

		const getPluginStyleOverrides = (styleOverrides: Partial<StyleOverrides> | undefined) => {
			if (this.styleOverridesSubpath === '') {
				return styleOverrides as UnresolvedStyleSettings<T> | undefined
			}
			return styleOverrides?.[this.styleOverridesSubpath as keyof StyleOverrides] as UnresolvedStyleSettings<T> | undefined
		}
		const themePluginStyleOverrides = getPluginStyleOverrides(theme.styleOverrides)
		const globalPluginStyleOverrides = getPluginStyleOverrides(styleOverrides)

		function resolveSetting<K extends keyof T>(propertyName: K): T[K] {
			let result = resolvedSettings[propertyName]
			if (result === undefined && !finishedResolving.has(propertyName)) {
				if (attemptedToResolve.has(propertyName)) throw new Error(`Circular dependency detected while resolving style setting '${propertyName as string}'`)
				attemptedToResolve.add(propertyName)

				const valueOrResolver = themePluginStyleOverrides?.[propertyName] || globalPluginStyleOverrides?.[propertyName] || defaultSettings[propertyName]
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
export type ResolvedStyleSettings<T> = { [K in keyof T]: T[K] }
