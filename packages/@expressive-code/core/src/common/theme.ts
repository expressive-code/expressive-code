import { guessThemeTypeFromEditorColors, resolveVSCodeWorkbenchColors, VSCodeThemeType, VSCodeWorkbenchColors } from '../internal/vscode-colors'
import { BUNDLED_THEMES, loadTheme as loadShikiTheme, IShikiTheme, IThemeRegistration } from 'shiki'

export interface ExpressiveCodeTheme extends Omit<IShikiTheme, 'type' | 'colors'> {
	type: VSCodeThemeType
	colors: VSCodeWorkbenchColors
}

export function loadThemeFromObject(theme: Partial<IShikiTheme>): ExpressiveCodeTheme {
	if (theme.type === 'css') throw new Error('Theme type "css" is not supported.')

	const { type: themeType, colors: themeColors, ...rest } = theme
	const resolvedType = themeType || guessThemeTypeFromEditorColors(themeColors)
	const resolvedColors = resolveVSCodeWorkbenchColors(themeColors, resolvedType)

	return {
		// Assign defaults in case the theme doesn't have them
		name: '',
		settings: [],
		fg: resolvedColors['editor.foreground'],
		bg: resolvedColors['editor.background'],
		// Set our resolved values
		type: resolvedType,
		colors: resolvedColors,
		// Override defaults with all given properties
		...rest,
	}
}

/**
 * Loads the given theme for use with Expressive Code. Supports both Shiki and VS Code themes.
 *
 * If you pass in a string, loading gets handled by Shiki. The string must either be
 * one of Shiki's bundled theme names (e.g. `dracula`), or the path to a JSON file.
 * As Shiki's theme loader is asynchronous, this function is also asynchronous.
 *
 * Alternatively, you can pass in an object which you have already imported or loaded
 * from a Shiki or VS Code JSON theme file. In this case, the object will be passed to
 * {@link loadThemeFromObject}.
 */
export async function loadTheme(theme: IThemeRegistration): Promise<ExpressiveCodeTheme> {
	if (typeof theme === 'string') {
		// When the given theme is a string, it can either be a bundled Shiki theme name,
		// or a file path
		const isBundledTheme = BUNDLED_THEMES.includes(theme as (typeof BUNDLED_THEMES)[number])
		const shikiTheme = await loadShikiTheme(isBundledTheme ? `themes/${theme}.json` : theme)
		return loadThemeFromObject(shikiTheme)
	}

	return loadThemeFromObject(theme)
}
