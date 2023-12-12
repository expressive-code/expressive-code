import { readFileSync } from 'fs'
import { join } from 'path'
import { ExpressiveCodeTheme } from '@expressive-code/core'
import { BuiltinTheme, bundledThemes } from 'shikiji'

export const testThemeNames = ['ayu-green-dark-bordered', 'empty-light', 'shades-of-purple', 'synthwave-color-theme', 'vim-dark-medium']

export const loadTestTheme = (themeName: (typeof testThemeNames)[number]) => {
	const themeContents = readFileSync(join(__dirname, '..', 'themes', `${themeName}.json`), 'utf8')
	return ExpressiveCodeTheme.fromJSONString(themeContents)
}

export async function loadBundledShikiTheme(bundledThemeName: string) {
	const shikiTheme = (await bundledThemes[bundledThemeName as BuiltinTheme]()).default
	return new ExpressiveCodeTheme(shikiTheme)
}

export async function loadTestThemes() {
	const themes = testThemeNames.map(loadTestTheme)

	// Add a few shiki themes
	themes.unshift(await loadBundledShikiTheme('nord'))
	themes.unshift(await loadBundledShikiTheme('dracula'))
	themes.unshift(await loadBundledShikiTheme('material-theme'))
	themes.unshift(await loadBundledShikiTheme('github-light'))
	themes.unshift(await loadBundledShikiTheme('github-dark'))

	return themes
}
