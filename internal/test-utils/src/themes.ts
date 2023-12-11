import { readFileSync } from 'fs'
import { join } from 'path'
import { ExpressiveCodeTheme } from '@expressive-code/core'
import { BuiltinTheme } from 'shikiji'
import { loadTheme } from 'shikiji-compat'

export const testThemeNames = ['ayu-green-dark-bordered', 'empty-light', 'shades-of-purple', 'synthwave-color-theme', 'vim-dark-medium']

export const loadTestTheme = (themeName: (typeof testThemeNames)[number]) => {
	const themeContents = readFileSync(join(__dirname, '..', 'themes', `${themeName}.json`), 'utf8')
	return ExpressiveCodeTheme.fromJSONString(themeContents)
}

export async function loadBundledShikiTheme(bundledThemeName: string) {
	const shikiTheme = await loadTheme(bundledThemeName as BuiltinTheme)

	// Unfortunately, some of the themes bundled with Shiki have an undefined theme type,
	// and Shiki always defaults to 'dark' in this case, leading to incorrect UI colors.
	// To fix this, we remove the type property here, which causes the ExpressiveCodeTheme
	// constructor to autodetect the correct type.
	const shikiThemeWithoutType: Partial<typeof shikiTheme> = { ...shikiTheme }
	delete shikiThemeWithoutType.type

	return new ExpressiveCodeTheme(shikiThemeWithoutType)
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
