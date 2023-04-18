import { describe, test } from 'vitest'
import { ExpressiveCodeTheme } from '@expressive-code/core'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures } from '@internal/test-utils'
// import dracula from 'shiki/themes/dracula.json'
import { pluginShiki } from '../src'

const jsTestCode = `
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    extendDefaultPlugins: false,
    smartypants: false,
    gfm: false,
  }
});
`.trim()

describe('Renders syntax highlighting', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	test(
		'Supports various themes',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: jsTestCode,
					language: 'js',
					meta: '',
					plugins: [pluginShiki()],
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)
})
