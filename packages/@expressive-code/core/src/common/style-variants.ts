import { resolveStyleSettings, getCssVarDeclarations } from '../internal/style-resolving'
import { ExpressiveCodePlugin, ResolverContext } from './plugin'
import { StyleOverrides, ResolvedStyleSettingsByPath } from './plugin-style-settings'
import { ExpressiveCodeTheme } from './theme'

export type StyleVariant = {
	theme: ExpressiveCodeTheme
	resolvedStyleSettings: ResolvedStyleSettingsByPath
	cssVarDeclarations: CssVarDeclarations
}

export type CssVarDeclarations = Map<string, string>

/**
 * Maps the given `themes` to an array of {@link StyleVariant `StyleVariant`} objects,
 * doing the following per theme:
 * - Resolving all style settings contributed by core & plugins,
 *   respecting both theme and global `styleOverrides` (theme overrides take precedence)
 * - Generating CSS variable declarations for the resolved style settings
 */
export function resolveStyleVariants({
	themes,
	plugins,
	styleOverrides,
	cssVarName,
}: {
	themes: ExpressiveCodeTheme[]
	plugins: readonly ExpressiveCodePlugin[]
	styleOverrides: StyleOverrides
	cssVarName: ResolverContext['cssVarName']
}): StyleVariant[] {
	return themes.map((theme) => {
		// Resolve all style settings contributed by core & plugins,
		// respecting both global and theme `styleOverrides` (theme overrides take precedence)
		const resolvedStyleSettings = resolveStyleSettings({ theme, plugins, styleOverrides })

		// Generate CSS variable declarations for the resolved style settings,
		// omitting any settings excluded from CSS variable output by plugins
		const cssVarDeclarations = getCssVarDeclarations({ resolvedStyleSettings, plugins, cssVarName })

		return {
			theme,
			resolvedStyleSettings,
			cssVarDeclarations,
		}
	})
}
