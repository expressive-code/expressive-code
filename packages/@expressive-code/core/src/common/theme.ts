import { guessThemeTypeFromEditorColors, resolveVSCodeWorkbenchColors, VSCodeThemeType, VSCodeWorkbenchColors } from '../internal/vscode-colors'

export type ExpressiveCodeThemeContents = { name: string; type?: 'light' | 'dark'; colors?: { [key: string]: string } }

export class ExpressiveCodeTheme {
	readonly name: string
	readonly type: VSCodeThemeType
	// /** Default foreground color */
	// readonly fg: string
	// /** Default background color */
	// readonly bg: string
	readonly colors: VSCodeWorkbenchColors

	constructor({ name, type, colors }: ExpressiveCodeThemeContents) {
		this.name = name
		this.type = type || guessThemeTypeFromEditorColors(colors)
		// this.fg = fg
		// this.bg = bg
		this.colors = resolveVSCodeWorkbenchColors(colors, this.type)
	}
}
