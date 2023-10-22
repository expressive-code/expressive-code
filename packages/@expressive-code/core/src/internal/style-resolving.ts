import { coreStyleSettings } from '../common/core-styles'
import { ExpressiveCodePlugin, ResolverContext } from '../common/plugin'
import { StyleOverrides, ResolvedStyleSettingsByPath, StyleSettingPath, StyleValueOrValues, UnresolvedStyleValue } from '../common/plugin-style-settings'
import { ExpressiveCodeTheme } from '../common/theme'

/**
 * Resolves all style settings contributed by core & plugins for the given theme.
 *
 * Respects both theme and global `styleOverrides` (theme overrides take precedence).
 */
export function resolveStyleSettings({
	theme,
	plugins,
	styleOverrides,
}: {
	theme: ExpressiveCodeTheme
	plugins: readonly ExpressiveCodePlugin[]
	styleOverrides: StyleOverrides | undefined
}): ResolvedStyleSettingsByPath {
	const attemptedToResolve = new Set<StyleSettingPath>()
	const resolvedByPath: ResolvedStyleSettingsByPath = new Map()
	const resolverArgs = { theme, resolveSetting }

	// Start by mapping all core setting paths to their default values
	const unresolvedByPath = getStyleSettingsByPath(coreStyleSettings.defaultValues)

	// Add all plugin settings with their default values
	plugins.forEach((plugin) => {
		if (!plugin.styleSettings) return
		applyStyleSettings(unresolvedByPath, getStyleSettingsByPath(plugin.styleSettings.defaultValues))
	})

	// Apply any global style overrides
	applyStyleSettings(unresolvedByPath, getStyleSettingsByPath(styleOverrides ?? {}))

	// Apply any theme style overrides
	applyStyleSettings(unresolvedByPath, getStyleSettingsByPath(theme.styleOverrides ?? {}))

	// Define a setting resolver function that can be used both by plugins and ourselves
	function resolveSetting(settingPath: StyleSettingPath): string {
		let result = resolvedByPath.get(settingPath)
		if (result === undefined && !resolvedByPath.has(settingPath)) {
			if (attemptedToResolve.has(settingPath)) throw new Error(`Circular dependency detected while resolving style setting '${settingPath as string}'`)
			attemptedToResolve.add(settingPath)

			const valueOrResolver = unresolvedByPath.get(settingPath)
			const resolvedDefinition = (typeof valueOrResolver === 'function' ? valueOrResolver(resolverArgs) : valueOrResolver) as StyleValueOrValues
			result = Array.isArray(resolvedDefinition) ? resolvedDefinition[theme.type === 'dark' ? 0 : 1] : resolvedDefinition

			resolvedByPath.set(settingPath, result)
		}
		// TODO: Decide if we want to throw an error instead if a setting resolves to `undefined`
		return result!
	}

	// Resolve all settings
	unresolvedByPath.forEach((_, settingPath) => resolveSetting(settingPath))

	return resolvedByPath
}

/**
 * Generates CSS variable declarations from the given resolved style settings.
 *
 * Style setting paths excluded by any of the plugins (`<plugin>.styleSettings.cssVarExclusions`)
 * are automatically omitted from the returned map.
 */
export function getCssVarDeclarations({
	resolvedStyleSettings,
	plugins,
	cssVarName,
}: {
	resolvedStyleSettings: ResolvedStyleSettingsByPath
	plugins: readonly ExpressiveCodePlugin[]
	cssVarName: ResolverContext['cssVarName']
}): Map<string, string> {
	const cssVarDeclarations = new Map<string, string>()
	const excludedPaths = new Set<StyleSettingPath>()
	plugins.forEach((plugin) => {
		plugin.styleSettings?.cssVarExclusions.forEach((path) => excludedPaths.add(path))
	})
	resolvedStyleSettings.forEach((value, path) => {
		if (excludedPaths.has(path)) return
		cssVarDeclarations.set(cssVarName(path), value)
	})
	return cssVarDeclarations
}

type UnresolvedStyleSettingsByPath = Map<StyleSettingPath, UnresolvedStyleValue>

/**
 * Converts the given style settings object into a map of style setting paths to values.
 *
 * This non-nested format makes it easier to process the settings later on.
 */
function getStyleSettingsByPath(styleSettings: { [K: string]: UnresolvedStyleValue | { [K: string]: UnresolvedStyleValue } }): UnresolvedStyleSettingsByPath {
	const result: UnresolvedStyleSettingsByPath = new Map()

	for (const [key, value] of Object.entries(styleSettings)) {
		if (typeof value === 'object' && !Array.isArray(value)) {
			Object.entries(value).forEach(([subKey, subValue]) => {
				result.set(`${key}.${subKey}` as StyleSettingPath, subValue)
			})
		} else {
			result.set(key as StyleSettingPath, value)
		}
	}

	return result
}

/**
 * Applies any non-`undefined` values from `source` to `target`.
 */
function applyStyleSettings(target: UnresolvedStyleSettingsByPath, source: UnresolvedStyleSettingsByPath) {
	source.forEach((value, path) => value !== undefined && target.set(path, value))
}
