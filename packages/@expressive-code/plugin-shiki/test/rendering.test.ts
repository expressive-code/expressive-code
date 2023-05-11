import { describe, test, expect } from 'vitest'
import { toHtml } from 'hast-util-to-html'
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

const shellTestCode = `
# create a new project with an official example
npm create astro@latest -- --template <example-name>

# create a new project based on a GitHub repository's main branch
npm create astro@latest -- --template <github-username>/<github-repo>
`.trim()

describe('Renders syntax highlighting', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	test(
		'Supports themes in editor',
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

	test(
		'Supports themes in terminal',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: shellTestCode,
					language: 'shell',
					meta: '',
					plugins: [pluginShiki()],
					blockValidationFn: ({ renderedGroupAst }) => {
						const html = toHtml(renderedGroupAst)
						expect(html).toContain('example-name')
					},
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)
})
