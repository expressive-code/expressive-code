import { CoreStyleSettings } from '../internal/core-styles'
import { cssVarReplacements } from '../internal/css'
import { ExpressiveCodeTheme } from './theme'

export interface StyleSettings extends CoreStyleSettings {}

/**
 * The value of a single style setting. You can either set it to a string,
 * or an array of two strings.
 *
 * If you use the array form, the first value will be used for dark themes,
 * and the second value for light themes.
 */
export type StyleValueOrValues = string | [dark: string, light: string]

/**
 * A function that resolves a single style setting to a {@link StyleValueOrValues}.
 *
 * You can assign this to any style setting to dynamically generate style values
 * based on the current theme.
 *
 * This function is called once for each style variant in the engine's `styleVariants` array,
 * which includes one entry per theme in the engine's `themes` configuration option.
 */
export type StyleResolverFn = (context: {
	theme: ExpressiveCodeTheme
	/** The index in the engine's `styleVariants` array that's currently being resolved. */
	styleVariantIndex: number
	resolveSetting: (settingPath: StyleSettingPath) => string
}) => StyleValueOrValues

/**
 * This is the value type for all style overrides.
 * It allows either static style values or a resolver function.
 */
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

/**
 * Generates a CSS variable name for a given style setting path.
 *
 * Performs the following transformations on the path:
 * - To avoid name collisions, the name is prefixed with `--ec-`.
 * - All dots in the path are replaced with dashes.
 * - Various common terms are replaced with shorter alternatives to reduce CSS size
 *   (see {@link cssVarReplacements}).
 */
export function getCssVarName(styleSetting: StyleSettingPath) {
	let varName = styleSetting.replace(/\./g, '-')
	const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1)
	cssVarReplacements.forEach((replacement, term) => {
		const termRegExp = new RegExp(
			[
				// The lowercase term,
				// preceded by a non-lowercase character or the beginning of the string,
				// and followed by a non-lowercase character or the end of the string
				`(?<=[^a-z]|^)${term}(?=[^a-z]|$)`,
				// The capitalized term,
				// preceded by a lowercase character or the beginning of the string,
				// and followed by a non-lowercase character or the end of the string
				`(?<=[a-z]|^)${capitalize(term)}(?=[^a-z]|$)`,
			].join('|'),
			'g'
		)
		varName = varName.replace(termRegExp, (match) => (match === term ? replacement : capitalize(replacement)))
	})
	return `--ec-${varName}`
}

export const codeLineClass = 'ec-line'
