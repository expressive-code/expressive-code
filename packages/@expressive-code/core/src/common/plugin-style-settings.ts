import { StyleSettings } from './core-styles'
import { ExpressiveCodeTheme } from './theme'

/**
 * Represents a strongly typed set of style settings provided by a plugin (or core).
 *
 * The constructor expects an object with a `defaultSettings` property. This property must contain
 * the default values for all settings and will be made available as a public instance property.
 * Allowed default value types are plain values (e.g. strings), an array of two values
 * to provide a dark and light variant, or resolver functions that return one of these types.
 *
 * If you are writing a plugin that provides style overrides, please merge your style overrides
 * into the `StyleOverrides` interface declaration provided by the `@expressive-code/core` module.
 * You can see an example of this below.
 *
 * As a plugin author, you should also assign an instance of this class to your plugin's
 * `styleSettings` property. This allows the engine to automatically declare CSS variables
 * for your style settings in all theme variants defined in the config.
 *
 * To consume the CSS variables in your plugin's `baseStyles` or anywhere else, see the
 * {@link cssVar} method to get a CSS variable reference to any style setting.
 *
 * If CSS variables should not be generated for some of your style settings, you can exclude them
 * using the `cssVarExclusions` property of the object passed to the constructor.
 *
 * @example
 * // When using TypeScript: Declare the types of your style settings
 * interface FramesStyleSettings {
 *   fontFamily: string
 *   fontSize: string
 *   minContrast: string
 *   titleBarForeground: string
 * }
 *
 * // When using TypeScript: Merge your style settings into the core module's `StyleSettings`
 * declare module '@expressive-code/core' {
 *   export interface StyleSettings {
 *     frames: UnresolvedStyleSettings<FramesStyleSettings>
 *   }
 * }
 *
 * const framesStyleSettings = new StyleSettings({
 *   defaultSettings: {
 *     frames: {
 *       fontFamily: 'sans-serif',
 *       fontSize: '1rem',
 *       minContrast: '5',
 *       titleBarForeground: ({ theme }) => theme.colors['editor.foreground'],
 *     }
 *   },
 *   cssVarExclusions: ['frames.minContrast'],
 * })
 *
 * // ↓↓↓
 *
 * framesStyleSettings.defaultSettings.frames.fontFamily         // 'sans-serif'
 * framesStyleSettings.defaultSettings.frames.fontSize           // '1rem'
 * framesStyleSettings.defaultSettings.frames.minContrast        // '5'
 * framesStyleSettings.defaultSettings.frames.titleBarForeground // ({ theme }) => theme.colors['editor.foreground']
 */
export class PluginStyleSettings {
	readonly defaultValues: Partial<UnresolvedStyleSettings>
	readonly cssVarExclusions: StyleSettingPath[]

	constructor({ defaultValues, cssVarExclusions = [] }: { defaultValues: Partial<UnresolvedStyleSettings>; cssVarExclusions?: StyleSettingPath[] | undefined }) {
		this.defaultValues = defaultValues
		this.cssVarExclusions = cssVarExclusions
	}
}

export type StyleValueOrValues = string | [dark: string, light: string]
export type StyleResolverFn = ({ theme, resolveSetting }: { theme: ExpressiveCodeTheme; resolveSetting: (settingPath: StyleSettingPath) => string }) => StyleValueOrValues
export type UnresolvedStyleValue = StyleValueOrValues | StyleResolverFn

export type UnresolvedPluginStyleSettings<T> = {
	[SettingName in keyof T]: UnresolvedStyleValue
}

type Keys<T> = Exclude<keyof T, symbol>
type FlattenKeys<T> = { [K in Keys<T>]: T[K] extends object ? `${K}.${Keys<T[K]>}` : K }[Keys<T>]

export type StyleSettingPath = FlattenKeys<StyleSettings>

export type UnresolvedStyleSettings = {
	[K in keyof StyleSettings]: StyleSettings[K] extends object ? UnresolvedPluginStyleSettings<StyleSettings[K]> : UnresolvedStyleValue
}

export type StyleOverrides = Partial<{
	[K in keyof StyleSettings]: StyleSettings[K] extends object ? Partial<UnresolvedPluginStyleSettings<StyleSettings[K]>> : UnresolvedStyleValue
}>

export type ResolvedStyleSettingsByPath = Map<StyleSettingPath, string>
