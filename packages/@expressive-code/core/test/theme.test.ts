import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { loadTheme as shikiLoadTheme } from 'shiki'
import dracula from 'shiki/themes/dracula.json'
import githubLight from 'shiki/themes/github-light.json'
import { ExpressiveCodeTheme } from '../src/common/theme'
import { ExpressiveCodeEngine } from '../src/common/engine'

describe('ExpressiveCodeTheme', () => {
	describe('Throws on invalid themes', () => {
		test('Invalid color value', () => {
			expect(() => loadThemeFromJsonFile('invalid-2.json')).toThrow()
		})
		test('Unsupported CSS theme', () => {
			expect(() => loadThemeFromJsonFile('css.json')).toThrow()
		})
	})

	describe('Ignores invalid values in themes', () => {
		// VS Code seems to be able to load themes with empty strings as color values
		test('Empty color value', () => {
			const emptyValueTheme = loadThemeFromJsonFile('invalid-1.json')
			// Expect the correct default color to be set
			expect(emptyValueTheme.colors['editor.background']).toBe('#1e1e1e')
		})
		test('Non-string color value', () => {
			const emptyValueTheme = loadThemeFromJsonFile('invalid-3.json')
			// Expect the correct default color to be set
			expect(emptyValueTheme.colors['editor.background']).toBe('#1e1e1e')
		})
	})

	describe('Can load local themes', () => {
		test('empty-dark.json', () => {
			const theme = loadThemeFromJsonFile('empty-dark.json')
			expect(theme.name).toBe('empty-dark')

			// Expect the correct default colors to be set
			expect(theme.colors['editor.background']).toBe('#1e1e1e')
			expect(theme.colors['editor.foreground']).toBe('#bbbbbb')

			// Expect color lookups to have the correct values
			expect(theme.colors['menu.foreground']).toBe('#f0f0f0')

			// Expect multi-level color lookups to work, too:
			//    'editorHoverWidget.foreground'
			// -> 'editorWidget.foreground'
			// -> 'foreground'
			expect(theme.colors['editorHoverWidget.foreground']).toBe('#cccccc')

			// Expect colors with "transparent" transform to have the correct values
			expect(theme.colors['editorInlayHint.background']).toBe('#4d4d4dcc')

			// Expect colors with "lighten" transform to have the correct values
			expect(theme.colors['toolbar.activeBackground']).toBe('#63666750')

			// Expect colors with "lessProminent" transform to have the correct values
			expect(theme.colors['editor.selectionHighlightBackground']).toBe('#1d3b5a99')

			// Expect `null` colors to remain `null`
			expect(theme.colors['contrastBorder']).toBeNull()
			// ...also if they are referenced by other colors
			expect(theme.colors['button.border']).toBeNull()
		})
		test('empty.json', () => {
			const theme = loadThemeFromJsonFile('empty.json')

			// Expect the guessed theme type to be correct (defaults to dark if no colors are set)
			expect(theme.type).toBe('dark')

			// Expect the same default colors as in empty-dark.json
			expect(theme.colors['editor.background']).toBe('#1e1e1e')
			expect(theme.colors['editor.foreground']).toBe('#bbbbbb')
		})
		test('empty-light.json', () => {
			const theme = loadThemeFromJsonFile('empty-light.json')
			expect(theme.name).toBe('empty-light')

			// Expect the correct default colors to be set
			expect(theme.colors['editor.background']).toBe('#ffffff')
			expect(theme.colors['editor.foreground']).toBe('#333333')

			// Expect color lookups to have the correct values
			// (this is a multi-level lookup in light themes, too)
			expect(theme.colors['menu.foreground']).toBe('#616161')

			// Expect colors with "transparent" transform to have the correct values
			expect(theme.colors['editorInlayHint.background']).toBe('#c4c4c499')

			// Expect colors with "darken" transform to have the correct values
			expect(theme.colors['toolbar.activeBackground']).toBe('#a6a6a650')

			// Expect colors with "lessProminent" transform to have the correct values
			expect(theme.colors['editor.selectionHighlightBackground']).toBe('#dbedff99')

			// Expect `null` colors to remain `null`
			expect(theme.colors['contrastBorder']).toBeNull()
			// ...also if they are referenced by other colors
			expect(theme.colors['button.border']).toBeNull()
		})
		test('dark-plus.json', () => {
			const theme = loadThemeFromJsonFile('dark-plus.json')
			expect(theme.name).toBe('Dark+ (default dark)')

			// Expect the correct default colors to be set
			expect(theme.colors['editor.background']).toBe('#222225')
			expect(theme.colors['editor.foreground']).toBe('#d4d4d4')

			// Expect color lookups to have the correct values
			expect(theme.colors['menu.foreground']).toBe('#cccccc')

			// Expect colors with "transparent" transform to have the correct values
			expect(theme.colors['editorInlayHint.background']).toBe('#4d4d4dcc')

			// Expect colors with "lighten" transform to have the correct values
			expect(theme.colors['editorHoverWidget.statusBarBackground']).toBe('#2c2c2d')

			// Expect colors with "lessProminent" transform to have the correct values
			expect(theme.colors['editor.selectionHighlightBackground']).toBe('#add6ff26')
		})
	})

	describe('Can load themes from NPM package imports', () => {
		test('dracula', () => {
			const theme = new ExpressiveCodeTheme(dracula)

			// Expect the guessed theme type to be correct (it's not contained in most Shiki themes)
			expect(theme.type).toBe('dark')

			// Expect some colors to match the ones from the loaded JSON file
			expect(theme.colors['editor.background']).toBe(dracula.colors?.['editor.background'].toLowerCase())
			expect(theme.colors['editor.foreground']).toBe(dracula.colors?.['editor.foreground'].toLowerCase())
			expect(theme.colors['tab.activeBorderTop']).toBe(dracula.colors?.['tab.activeBorderTop'].toLowerCase())
		})
		test('github-light', () => {
			const theme = new ExpressiveCodeTheme(githubLight)

			// Expect the guessed theme type to be correct (it's not contained in most Shiki themes)
			expect(theme.type).toBe('light')

			// Expect some colors to match the ones from the loaded JSON file
			expect(theme.colors['editor.background']).toBe(githubLight.colors?.['editor.background'].toLowerCase())
			expect(theme.colors['editor.foreground']).toBe(githubLight.colors?.['editor.foreground'].toLowerCase())
			expect(theme.colors['tab.activeBorderTop']).toBe(githubLight.colors?.['tab.activeBorderTop'].toLowerCase())
		})
	})

	describe('Can import themes loaded by Shiki', () => {
		test('dracula', async () => {
			const theme = new ExpressiveCodeTheme(await shikiLoadTheme('themes/dracula.json'))

			// Expect the guessed theme type to be correct (it's not contained in most Shiki themes)
			expect(theme.type).toBe('dark')

			// Expect some colors to match the ones from our import
			expect(theme.colors['editor.background']).toBe(dracula.colors?.['editor.background'].toLowerCase())
			expect(theme.colors['editor.foreground']).toBe(dracula.colors?.['editor.foreground'].toLowerCase())
			expect(theme.colors['tab.activeBorderTop']).toBe(dracula.colors?.['tab.activeBorderTop'].toLowerCase())
		})
	})

	describe('Can be copied by passing an existing instance', () => {
		test('Properties are copied correctly', async () => {
			const theme = new ExpressiveCodeTheme(await shikiLoadTheme('themes/dracula.json'))
			const copy = new ExpressiveCodeTheme(theme)

			// Expect the copied theme to have the same main properties
			expect(copy.name).toBe(theme.name)
			expect(copy.type).toBe(theme.type)

			// Expect the copied theme to have the same colors and settings
			expect(copy.colors).toEqual(theme.colors)
			expect(copy.settings).toEqual(theme.settings)
		})
		test('Copy can be modified without affecting the original', async () => {
			const theme = new ExpressiveCodeTheme(await shikiLoadTheme('themes/dracula.json'))
			const copy = new ExpressiveCodeTheme(theme)

			// Expect the copied theme to have the same colors
			expect(copy.colors).toEqual(theme.colors)

			// Modify the copied colors and expect the original to be unaffected
			copy.colors['editor.background'] = '#ffffff'
			expect(copy.colors['editor.background']).toBe('#ffffff')
			expect(theme.colors['editor.background']).toBe('#282a36')

			// Modify the copied settings and expect the original to be unaffected
			type ThemeSettings = { scope: string | string[]; settings: { [key: string]: string } }[]
			const findMarkupInsertedEntry = (settings: ThemeSettings) => settings.find((s) => Array.isArray(s.scope) && s.scope.includes('markup.inserted'))
			const copyMarkupInserted = findMarkupInsertedEntry(copy.settings as ThemeSettings)
			copyMarkupInserted!.settings.foreground = '#0ab0c0'
			expect(copyMarkupInserted!.settings.foreground).toBe('#0ab0c0')
			const themeMarkupInserted = findMarkupInsertedEntry(theme.settings as ThemeSettings)
			expect(themeMarkupInserted!.settings.foreground).toBe('#50FA7B')
		})
	})

	describe('Can apply color adjustments to themes', () => {
		test('Can adjust colors of "github-dark"', async () => {
			const theme = new ExpressiveCodeTheme(await shikiLoadTheme('themes/github-dark.json'))
			theme.applyHueAndChromaAdjustments({
				backgrounds: '#3b82f6',
				accents: '#a3e635',
				custom: [{ themeColorKeys: ['panel.background', 'panel.border'], targetHueAndChroma: '#823bf6' }],
			})

			// Expect background colors to be adjusted
			// - Original github-dark color: #24292e
			expect(theme.colors['editor.background']).toBe('#04255a')

			// Expect accent colors to be adjusted
			// - Original github-dark color: #3392ff44
			expect(theme.colors['editor.selectionBackground']).toBe('#73a42344')

			// Expect custom colors to be adjusted
			// - Original github-dark color: #1b1f23
			expect(theme.colors['panel.border']).toBe('#250451')

			// Expect custom colors to override other adjustments
			// - Original github-dark color: #1b1f23
			// - Recolored by `backgrounds`: #032050
			expect(theme.colors['panel.background']).toBe('#2a065b')
		})
		test('Can use the "customizeTheme" option to adjust colors', () => {
			const engine = new ExpressiveCodeEngine({
				customizeTheme: (theme) => {
					theme.applyHueAndChromaAdjustments({
						backgrounds: '#3b82f6',
						accents: '#a3e635',
						custom: [{ themeColorKeys: ['panel.background', 'panel.border'], targetHueAndChroma: '#823bf6' }],
					})
				},
			})

			// Expect background colors to be adjusted
			// - Original github-dark color: #24292e
			expect(engine.theme.colors['editor.background']).toBe('#04255a')

			// Also expect resolved core styles to have picked up the adjusted colors
			expect(engine.styleVariants[0].resolvedStyleSettings.get('codeBackground')).toBe('#04255a')
		})
	})

	describe('Can override core styles using the "styleOverrides" property', () => {
		test('Themes can override the default styles', async () => {
			const theme = new ExpressiveCodeTheme(await shikiLoadTheme('themes/github-dark.json'))
			theme.styleOverrides.codeBackground = 'var(--test-code-bg)'
			theme.styleOverrides.uiFontFamily = 'MyUiTestFont'

			const engine = new ExpressiveCodeEngine({
				theme,
			})

			// Expect the resolved core styles to contain the new values
			expect(engine.styleVariants[0].resolvedStyleSettings.get('codeBackground')).toBe('var(--test-code-bg)')
			expect(engine.styleVariants[0].resolvedStyleSettings.get('uiFontFamily')).toBe('MyUiTestFont')

			// Expect the base styles to contain the new values
			// TODO: Develop an API that allows retrieving the CSS variable declarations from the engine,
			// separately from the static base styles.
			const baseStyles = await engine.getBaseStyles()
			expect(baseStyles).toContain('var(--test-code-bg)')
			expect(baseStyles).toMatch(/font-family:\s*MyUiTestFont/)
		})
		test('Theme styleOverrides take precedence over global styleOverrides', async () => {
			const theme = new ExpressiveCodeTheme(await shikiLoadTheme('themes/github-dark.json'))
			theme.styleOverrides.codeBackground = '#fedcba98'
			theme.styleOverrides.uiFontFamily = 'MyThemeProvidedFont'

			const engine = new ExpressiveCodeEngine({
				theme,
				styleOverrides: {
					codeBackground: '#123456',
					uiFontFamily: 'ThisFontShouldBeOverwritten',
				},
			})

			// Expect the resolved core styles to contain the new values
			expect(engine.styleVariants[0].resolvedStyleSettings.get('codeBackground')).toBe('#fedcba98')
			expect(engine.styleVariants[0].resolvedStyleSettings.get('uiFontFamily')).toBe('MyThemeProvidedFont')

			// Expect the base styles to contain the new values
			// TODO: Develop an API that allows retrieving the CSS variable declarations from the engine,
			// separately from the static base styles.
			const baseStyles = await engine.getBaseStyles()
			expect(baseStyles).toContain('#fedcba98')
			expect(baseStyles).toMatch(/font-family:\s*MyThemeProvidedFont/)
		})
	})
})

function loadThemeFromJsonFile(fileName: string) {
	const jsonString = fs.readFileSync(path.join(__dirname, 'themes', fileName), 'utf8')
	return ExpressiveCodeTheme.fromJSONString(jsonString)
}
