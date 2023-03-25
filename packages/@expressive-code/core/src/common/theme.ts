import { resolveVSCodeWorkbenchColors, VSCodeThemeType, VSCodeWorkbenchColors } from '../internal/vscode-colors'

export type ExpressiveCodeThemeOptions = { name: string; type: 'light' | 'dark'; settings: unknown[]; colors: { [key: string]: string } }

export class ExpressiveCodeTheme {
	readonly name: string
	readonly type: VSCodeThemeType
	readonly settings: unknown[]
	// /** Default foreground color */
	// readonly fg: string
	// /** Default background color */
	// readonly bg: string
	readonly colors: VSCodeWorkbenchColors

	constructor({ name, type, settings, colors }: ExpressiveCodeThemeOptions) {
		this.name = name
		this.type = type
		this.settings = settings
		// this.fg = fg
		// this.bg = bg
		this.colors = resolveVSCodeWorkbenchColors(colors, type)
	}
}
