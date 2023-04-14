import { ResolvedCoreStyles } from '../common/core-styles'
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
export class StyleSettings<T extends string> {
	readonly defaultSettings: UnresolvedStyleSettings<T>

	constructor(defaultSettings: UnresolvedStyleSettings<T>) {
		this.defaultSettings = defaultSettings
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
		styleOverrides?: Partial<UnresolvedStyleSettings<T>>
	}): ResolvedStyleSettings<T> {
		const resolvedSettings = {} as ResolvedStyleSettings<T>
		for (const propertyName in this.defaultSettings) {
			const valueOrResolver = styleOverrides?.[propertyName] || this.defaultSettings[propertyName]
			const resolvedDefinition: ColorDefinition = typeof valueOrResolver === 'function' ? valueOrResolver({ theme, coreStyles }) : valueOrResolver
			const resolvedValue = Array.isArray(resolvedDefinition) ? resolvedDefinition[theme.type === 'dark' ? 0 : 1] : resolvedDefinition
			resolvedSettings[propertyName] = resolvedValue
		}
		return resolvedSettings
	}
}

export type ColorDefinition = string | [dark: string, light: string]
export type CoreStyleResolverFn = ({ theme }: { theme: ExpressiveCodeTheme }) => ColorDefinition
export type StyleResolverFn = ({ theme, coreStyles }: { theme: ExpressiveCodeTheme; coreStyles: ResolvedCoreStyles }) => ColorDefinition
export type BaseStylesResolverFn = ({ theme, coreStyles }: { theme: ExpressiveCodeTheme; coreStyles: ResolvedCoreStyles }) => string
export type UnresolvedCoreStyleSettings<T extends string> = { [K in T]: ColorDefinition | CoreStyleResolverFn }
export type UnresolvedStyleSettings<T extends string> = { [K in T]: ColorDefinition | StyleResolverFn }
export type ResolvedStyleSettings<T extends string> = { [K in T]: string }
