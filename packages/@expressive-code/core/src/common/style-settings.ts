import { CoreStyleSettings } from '../internal/core-styles'
import { ExpressiveCodeTheme } from './theme'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StyleSettings extends CoreStyleSettings {}

export type StyleValueOrValues = string | [dark: string, light: string]
export type StyleResolverFn = ({
	theme,
	styleVariantIndex,
	resolveSetting,
}: {
	theme: ExpressiveCodeTheme
	/** The index in the engine's `styleVariants` array that's currently being resolved. */
	styleVariantIndex: number
	resolveSetting: (settingPath: StyleSettingPath) => string
}) => StyleValueOrValues
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

export const codeLineClass = 'ec-line'
