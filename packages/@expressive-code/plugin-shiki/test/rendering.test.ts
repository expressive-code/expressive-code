import { describe, test, expect } from 'vitest'
import { toHtml } from 'hast-util-to-html'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, loadTestThemes, loadBundledShikiTheme } from '@internal/test-utils'
// import dracula from 'shiki/themes/dracula.json'
import { pluginShiki } from '../src'

const jsTestCode = `
import { defineConfig } from 'astro/config';

/**
 * Some JSDoc test.
 */
export async function test(a, b, c) {
  let x = true
  let y = a.toString()
  const z = \`hello\${a === true ? 'x' : 'y'}\`
  const fn = () => "test\\nanother line"
}

// Single-line comment
var v = 300
test(1, Math.min(6, 2), defineConfig.someProp || v)

export default defineConfig({
  markdown: {
    'some.example': 2048,
    smartypants: false,
    gfm: false,
  }
});
`.trim()

const cssTestCode = `
@media (min-width: 50em) {
  :root {
    --min-spacing-inline: calc(0.5vw - 1.5rem);
    color: blue;
  }
  body, html, .test[data-size="large"], #id {
    background: linear-gradient(to top, #80f 1px, rgb(30, 90, 130) 50%);
  }
  .frame:focus-within :focus-visible ~ .copy button:not(:hover) {
    content: 'Hello \\000026 welcome!';
    opacity: 0.75;
  }
}
`.trim()

const astroTestCode = `
---
import Header from './Header.astro';
import Logo from './Logo.astro';
import Footer from './Footer.astro';

const { title } = Astro.props
---
<div id="content-wrapper" class="test">
  <Header />
  <Logo size="large"/>
  <h1>{title} &amp; some text</h1>
  <slot />  <!-- children will go here -->
  <Footer />
</div>
`.trim()

const pythonTestCode = `
import time

# Define a countdown function
def countdown(time_sec):
  while time_sec:
    mins, secs = divmod(time_sec, 60)
    timeformat = '{:02d}:{:02d}'.format(mins, secs)
    print(timeformat, end='\\r')
    time.sleep(1)
    time_sec -= 1
  print("stop")

countdown(5)
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
const ansiEscapeCode = /\u001b\[\d+m/gu

describe('Renders syntax highlighting', async () => {
	const themes = await loadTestThemes()

	test(
		'Supports themes in JS code',
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
		'Supports themes in Astro code',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: astroTestCode,
					language: 'astro',
					meta: '',
					plugins: [pluginShiki()],
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)

	test(
		'Supports themes in Python code',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: pythonTestCode,
					language: 'python',
					meta: '',
					plugins: [pluginShiki()],
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)

	test(
		'Supports themes in CSS code',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: cssTestCode,
					language: 'css',
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
		'Supports ansi highlighting',
		async ({ meta: { name: testName } }) => {
			let colorAssertionExecuted = false

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

						// Expect the ANSI colors of the "github-dark" theme to be present
						expect(html).toMatch(/<span [^>]*?style="[^"]*?:#56d4dd[^"]*?"> Context Testing ANSI<\/span>/)
						expect(html).toMatch(/<span [^>]*?style="[^"]*?:#fafbfc[^"]*?">Tests Passed: 1 <\/span>/)

						// Also expect the ANSI colors of the "dracula" theme to be present
						expect(html).toMatch(/<span [^>]*?style="[^"]*?:#a4ffff[^"]*?"> Context Testing ANSI<\/span>/)
						expect(html).toMatch(/<span [^>]*?style="[^"]*?:#ffffff[^"]*?">Tests Passed: 1 <\/span>/)

						colorAssertionExecuted = true
					},
				}),
			})

			expect(colorAssertionExecuted).toBe(true)
		},
		{ timeout: 5 * 1000 }
	)
})

describe('Language handling', async () => {
	const themes = [await loadBundledShikiTheme('dracula')]

	test(
		'Falls back to plaintext and logs a warning for unknown languages',
		async ({ meta: { name: testName } }) => {
			let colorAssertionExecuted = false
			const warnings: string[] = []

			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: [
					{
						fixtureName: '',
						themes,
						code: astroTestCode,
						language: 'unknown-test-language',
						meta: '',
						plugins: [pluginShiki()],
						engineOptions: {
							logger: {
								warn: (message) => warnings.push(message),
							},
						},
						blockValidationFn: ({ renderedGroupAst }) => {
							const html = toHtml(renderedGroupAst)
							expect(html).not.toMatch(ansiEscapeCode)

							// Select all inline colors and expect them to match
							// the default dracula theme foreground color
							const colors = [...html.matchAll(/<span [^>]*?style="--0:([^"]*?)">/g)].map((match) => match[1])
							const colorsNotMatchingDraculaFg = colors.filter((color) => color !== themes[0].fg)
							expect(colors.length).toBeGreaterThan(0)
							expect(colorsNotMatchingDraculaFg.length).toBe(0)

							colorAssertionExecuted = true
						},
					},
				],
			})

			expect(colorAssertionExecuted).toBe(true)

			// Ensure that the logger was called with a warning
			expect(warnings.length).toBe(1)
			expect(warnings[0]).toContain('unknown-test-language')
		},
		{ timeout: 5 * 1000 }
	)
})
