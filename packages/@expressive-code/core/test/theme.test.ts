import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { ExpressiveCodeTheme, ExpressiveCodeThemeOptions } from '../src/common/theme'

describe('ExpressiveCodeTheme', () => {
	test('Can load empty-dark.json', () => {
		const theme = loadTheme('empty-dark.json')
		expect(theme).toBeInstanceOf(ExpressiveCodeTheme)
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

	test('Can load dark-plus.json', () => {
		const theme = loadTheme('dark-plus.json')
		expect(theme).toBeInstanceOf(ExpressiveCodeTheme)
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

function loadTheme(fileName: string): ExpressiveCodeTheme {
	const jsonTheme = fs.readFileSync(path.join(__dirname, 'themes', fileName), 'utf8')
	const parsed = JSON.parse(jsonTheme) as ExpressiveCodeThemeOptions
	return new ExpressiveCodeTheme(parsed)
}
