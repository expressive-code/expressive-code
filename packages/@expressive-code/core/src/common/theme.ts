import { groupedDefaultWorkbenchColorKeys, guessThemeTypeFromEditorColors, resolveVSCodeWorkbenchColors, VSCodeThemeType, VSCodeWorkbenchColors } from '../internal/vscode-colors'
import stripJsonComments from 'strip-json-comments'
import type { IShikiTheme } from 'shiki'
import { chromaticRecolor, ChromaticRecolorTarget } from '../helpers/color-transforms'
import { StyleOverrides } from './core-styles'

export class ExpressiveCodeTheme implements Omit<IShikiTheme, 'type' | 'colors'> {
	name: string
	type: VSCodeThemeType
	colors: VSCodeWorkbenchColors
	fg: string
	bg: string
	semanticHighlighting: boolean
	settings: ThemeSetting[]
	styleOverrides: Partial<StyleOverrides>

	/**
	 * Loads the given theme for use with Expressive Code. Supports both Shiki and VS Code themes.
	 *
	 * You can also pass an existing `ExpressiveCodeTheme` instance to create a copy of it.
	 *
	 * Note: To save on bundle size, this constructor does not support loading themes
	 * bundled with Shiki by name (e.g. `dracula`). Instead, import Shiki's `loadTheme`
	 * function yourself, use it to load its bundled theme (e.g. `themes/dracula.json`),
	 * and pass the result to this constructor.
	 */
	constructor(theme: ExpressiveCodeThemeInput) {
		let themeType = theme.type
		if (themeType === 'css') throw new Error('Theme type "css" is not supported.')
		if (themeType !== 'dark' && themeType !== 'light') {
			themeType = guessThemeTypeFromEditorColors(theme.colors)
		}

		// Fix invalid themes by removing unsupported entries from theme colors
		const themeColors: typeof theme.colors = { ...theme.colors }
		for (const key in themeColors) {
			if (typeof themeColors[key] !== 'string' || !themeColors[key].trim().length) delete themeColors[key]
		}

		this.name = theme.name || ''
		this.type = themeType as VSCodeThemeType
		this.colors = resolveVSCodeWorkbenchColors(themeColors, this.type)
		this.fg = theme.fg || this.colors['editor.foreground']
		this.bg = theme.bg || this.colors['editor.background']
		this.semanticHighlighting = theme.semanticHighlighting || false
		// Shiki uses the `settings` property for theme tokens, VS Code uses `tokenColors`.
		// To allow passing both types of themes to this constructor, and to also allow passing
		// an ExpressiveCodeTheme instance directly to Shiki, we mimic Shiki's theme loader
		// and automatically migrate `tokenColors` (if defined) to `settings`.
		const themeTokenSettings = (theme.tokenColors as unknown[]) || theme.settings
		this.settings = this.parseThemeSettings(themeTokenSettings)
		this.styleOverrides = theme.styleOverrides ?? {}
	}

	/**
	 * Applies chromatic adjustments to entire groups of theme colors while keeping their
	 * relative lightness and alpha components intact. This can be used to quickly create
	 * theme variants that fit the color scheme of any website or brand.
	 *
	 * Adjustments can either be defined as hue and chroma values in the OKLCH color space
	 * (range 0–360 for hue, 0–0.4 for chroma), or these values can be extracted from
	 * hex color strings (e.g. `#3b82f6`).
	 *
	 * You can target predefined groups of theme colors (e.g. `backgrounds`, `accents`)
	 * and/or use the `custom` property to define your own groups of theme colors to be adjusted.
	 * Each custom group must contain a `themeColorKeys` property with an array of VS Code
	 * theme color keys (e.g. `['panel.background', 'panel.border']`) and a `targetHueAndChroma`
	 * property that accepts the same adjustment target values as `backgrounds` and `accents`.
	 * Custom groups will be applied in the order they are defined.
	 *
	 * Returns the same `ExpressiveCodeTheme` instance to allow chaining.
	 */
	applyHueAndChromaAdjustments(adjustments: {
		backgrounds?: string | ChromaticRecolorTarget | undefined
		accents?: string | ChromaticRecolorTarget | undefined
		custom?: { themeColorKeys: string[]; targetHueAndChroma: string | ChromaticRecolorTarget }[] | undefined
	}) {
		const adjustedColors: Partial<VSCodeWorkbenchColors> = {}
		const adjustColors = (colors: string[], target: string | ChromaticRecolorTarget) => {
			colors.forEach((color) => {
				if (!this.colors[color]) return
				adjustedColors[color] = chromaticRecolor(this.colors[color], target)
			})
		}
		if (adjustments.backgrounds) {
			adjustColors(groupedDefaultWorkbenchColorKeys.backgrounds, adjustments.backgrounds)
		}
		if (adjustments.accents) {
			adjustColors(groupedDefaultWorkbenchColorKeys.accents, adjustments.accents)
		}
		if (adjustments.custom) {
			adjustments.custom.forEach((custom) => {
				adjustColors(custom.themeColorKeys, custom.targetHueAndChroma)
			})
		}
		Object.assign(this.colors, adjustedColors)

		return this
	}

	/**
	 * Parses the given theme settings into a properly typed format
	 * that can be used by both Expressive Code and Shiki.
	 *
	 * As theme scopes can be defined as either a comma-separated string, or an array of strings,
	 * they will always be converted to their array form to simplify further processing.
	 *
	 * Also recreates known object properties to prevent accidental mutation
	 * of the original settings when copying a theme.
	 */
	private parseThemeSettings(settings: unknown[] | undefined): ThemeSetting[] {
		if (!settings || !Array.isArray(settings)) return []
		return settings.map((unknownSetting) => {
			const { name, scope: anyScope, settings, ...rest } = unknownSetting as ThemeSetting
			const scope: string[] | undefined = Array.isArray(anyScope) ? anyScope.slice() : typeof anyScope === 'string' ? (anyScope as string).split(/\s*,\s*/) : undefined
			return {
				...(name !== undefined ? { name } : {}),
				...(scope !== undefined ? { scope } : {}),
				settings: { ...settings },
				...rest,
			}
		})
	}

	/**
	 * Attempts to parse the given JSON string as a theme.
	 *
	 * As some themes follow the JSONC format and may contain comments and trailing commas,
	 * this method will attempt to strip them before parsing the result.
	 */
	static fromJSONString(json: string) {
		return new ExpressiveCodeTheme(JSON.parse(stripJsonComments(json, { trailingCommas: true })) as Partial<ExpressiveCodeTheme>)
	}
}

export type ExpressiveCodeThemeInput = Partial<Omit<ExpressiveCodeTheme | IShikiTheme, 'type'>> & {
	type?: VSCodeThemeType | string | undefined
	tokenColors?: unknown | undefined
	semanticHighlighting?: boolean | undefined
	styleOverrides?: Partial<StyleOverrides> | undefined
}

export type ThemeSetting = {
	name?: string | undefined
	scope?: string[] | undefined
	settings: {
		foreground?: string | undefined
		fontStyle?: string | undefined
	}
}
