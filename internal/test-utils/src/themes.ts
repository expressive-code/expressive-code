import { readFileSync } from 'fs'
import { join } from 'path'
import { ExpressiveCodeTheme } from '@expressive-code/core'

export const testThemeNames = ['ayu-green-dark-bordered', 'empty-light', 'shades-of-purple', 'synthwave-color-theme', 'vim-dark-medium']

export const loadTestTheme = (themeName: (typeof testThemeNames)[number]) => {
	const themeContents = readFileSync(join(__dirname, '..', 'themes', `${themeName}.json`), 'utf8')
	return ExpressiveCodeTheme.fromJSONString(themeContents)
}
