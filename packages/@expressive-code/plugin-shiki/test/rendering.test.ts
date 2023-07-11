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

const ansiTestCode = `
[95mRunning tests from 'C:\\Git\\Pester\\expressiveCodeAnsiDemo.tests.ps1'[0m
[92mDescribing Expressive Code[0m
[96m Context Testing ANSI[0m
[32m   [+] Success[0m[90m 3ms (1ms|2ms)[0m
[91m   [-] Failure[0m[90m 2ms (2ms|0ms)[0m
[91m    Expected 2, but got 1.[0m
[97mTests completed in 47ms[0m
[97mTests Passed: 1 [0m[91mFailed: 1 [0m[90mSkipped: 0 [0m[37m[0m[90mNotRun: 0[0m
`.trim()

// eslint-disable-next-line no-control-regex
const ansiEscapeCode = /\u001b\[\d+m/gmu

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

	test(
		'Supports ansi',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: ansiTestCode,
					language: 'ansi',
					meta: '',
					plugins: [pluginShiki()],
					blockValidationFn: ({ renderedGroupAst }) => {
						const html = toHtml(renderedGroupAst)
						expect(html).not.toMatch(ansiEscapeCode)
					},
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)
})
