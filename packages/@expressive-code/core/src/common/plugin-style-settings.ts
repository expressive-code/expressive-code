import { UnresolvedStyleSettings, StyleSettingPath } from './style-settings'

/**
 * Represents a strongly typed set of style settings provided by a plugin (or core).
 *
 * The constructor expects an object with a `defaultSettings` property. This property must contain
 * the default values for all settings and will be made available as a public instance property.
 * Allowed default value types are plain values (e.g. strings), an array of two values
 * to provide a dark and light variant, or resolver functions that return one of these types.
 *
 * If you are writing a plugin that provides style overrides, please merge your style overrides
 * into the `StyleSettings` interface declaration provided by the `@expressive-code/core` module.
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
 * If you want to provide descriptive names for your style settings, but keep the generated
 * CSS variable names short, you can pass an array of search and replace string pairs to the
 * `cssVarReplacements` property of the object passed to the constructor. The replacements
 * will be applied to all generated CSS variable names.
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
 *     frames: FramesStyleSettings
 *   }
 * }
 *
 * const framesStyleSettings = new PluginStyleSettings({
 *   defaultValues: {
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
 * framesStyleSettings.defaultValues.frames.fontFamily         // 'sans-serif'
 * framesStyleSettings.defaultValues.frames.fontSize           // '1rem'
 * framesStyleSettings.defaultValues.frames.minContrast        // '5'
 * framesStyleSettings.defaultValues.frames.titleBarForeground // ({ theme }) => theme.colors['editor.foreground']
 */
export class PluginStyleSettings {
	readonly defaultValues: Partial<UnresolvedStyleSettings>
	readonly cssVarExclusions: StyleSettingPath[]
	readonly cssVarReplacements: [string, string][]

	constructor({
		defaultValues,
		cssVarExclusions = [],
		cssVarReplacements = [],
	}: {
		defaultValues: Partial<UnresolvedStyleSettings>
		cssVarExclusions?: StyleSettingPath[] | undefined
		cssVarReplacements?: [string, string][] | undefined
	}) {
		this.defaultValues = defaultValues
		this.cssVarExclusions = cssVarExclusions
		this.cssVarReplacements = cssVarReplacements
	}
}
