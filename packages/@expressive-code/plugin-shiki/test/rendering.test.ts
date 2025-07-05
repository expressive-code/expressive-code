import { describe, test, expect } from 'vitest'
import { getInlineStyles, selectAll, toHtml, toText } from '@expressive-code/core/hast'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, loadTestThemes, loadBundledShikiTheme } from '@internal/test-utils'
import type { CodeToTokensOptions, ShikiTransformer, ShikiTransformerContextSource, ThemedToken } from 'shiki'
import { pluginShiki } from '../src'
import { regexp } from './assets/regexp.tmLanguage.js'
import type { ExpressiveCodeTheme } from '@expressive-code/core'

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

const jsTestInlineCode = `const getStringLength = (str) => str.length;`

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

const addedTestLanguage = {
	name: 'added-test-language',
	scopeName: 'source.added-test-language',
	displayName: 'test syntax',
	patterns: [
		{
			name: 'keyword.added-test-language',
			match: `\\b(import|const)\\b`,
		},
		{
			name: 'string.quoted.double.added-test-language',
			begin: '"',
			end: '"',
		},
	],
}

describe('Renders syntax highlighting', { timeout: 5 * 1000 }, async () => {
	const themes = await loadTestThemes()

	test('Supports themes in JS code', async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: jsTestCode,
				language: 'js',
				meta: '',
				plugins: [pluginShiki()],
				blockValidationFn: ({ renderedGroupAst }) => {
					const html = toHtml(renderedGroupAst)

					// sanity check on some of the expected highlighted contents - see actual snapshot for full manual verification
					validateHighlighting(html, themes[0], ['import', 'from', 'var'], false)
				},
			}),
		})
	})

	test('Supports themes in JS inline code', async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: jsTestInlineCode,
				language: 'js',
				type: 'inline',
				plugins: [pluginShiki()],
				blockValidationFn: ({ renderedGroupAst }) => {
					const html = toHtml(renderedGroupAst)

					// sanity check on some of the expected highlighted contents - see actual snapshot for full manual verification
					validateHighlighting(html, themes[0], ['const', 'getStringLength', '=>'], false)
				},
			}),
		})
	})

	test('Supports themes in Astro code', async ({ task: { name: testName } }) => {
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
	})

	test('Supports themes in Python code', async ({ task: { name: testName } }) => {
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
	})

	test('Supports themes in CSS code', async ({ task: { name: testName } }) => {
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
	})

	test('Supports themes in terminal', async ({ task: { name: testName } }) => {
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
	})

	test('Supports ansi highlighting', async ({ task: { name: testName } }) => {
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
					expect(html).toMatch(/<span [^>]*?style="[^"]*?:#56d4dd[^"]*?">Context Testing ANSI<\/span>/)
					expect(html).toMatch(/<span [^>]*?style="[^"]*?:#fafbfc[^"]*?">Tests Passed: 1 <\/span>/)

					// Also expect the ANSI colors of the "dracula" theme to be present
					expect(html).toMatch(/<span [^>]*?style="[^"]*?:#a4ffff[^"]*?">Context Testing ANSI<\/span>/)
					expect(html).toMatch(/<span [^>]*?style="[^"]*?:#ffffff[^"]*?">Tests Passed: 1 <\/span>/)

					colorAssertionExecuted = true
				},
			}),
		})

		expect(colorAssertionExecuted).toBe(true)
	})
})

describe('Language handling', { timeout: 5 * 1000 }, async () => {
	const themes = [await loadBundledShikiTheme('dracula')]

	test('Falls back to plaintext and logs a warning for unknown languages', async ({ task: { name: testName } }) => {
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
	})
	test('Allows adding custom languages', async ({ task: { name: testName } }) => {
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
					language: 'added-test-language',
					meta: '',
					plugins: [
						pluginShiki({
							langs: [addedTestLanguage],
						}),
					],
					engineOptions: {
						logger: {
							warn: (message) => warnings.push(message),
						},
					},
					blockValidationFn: ({ renderedGroupAst }) => {
						const html = toHtml(renderedGroupAst)

						// Select the contents of all spans that do not have the default
						// dracula theme foreground color
						const spansWithColorAndContent = [...html.matchAll(/<span [^>]*?style="--0:([^"]*?)">(.*?)<\/span>/g)]
						const highlightedSpans = spansWithColorAndContent.filter((match) => match[1].toLowerCase() !== themes[0].fg.toLowerCase())
						const highlightedContents = highlightedSpans.map((match) => match[2])
						expect(highlightedContents).toEqual([
							// Keywords
							'import',
							'import',
							'import',
							'const',
							// Strings
							'"content-wrapper"',
							'"test"',
							'"large"',
						])

						colorAssertionExecuted = true
					},
				},
			],
		})

		expect(colorAssertionExecuted).toBe(true)

		// Ensure that no warnings were logged
		expect(warnings.join('\n')).toEqual('')
	})
	test('Still supports default languages after adding a custom language', async ({ task: { name: testName } }) => {
		let colorAssertionExecuted = false
		const warnings: string[] = []

		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: [
				{
					fixtureName: '',
					themes,
					code: `import something from 'somewhere'`,
					language: 'js',
					meta: '',
					plugins: [
						pluginShiki({
							langs: [addedTestLanguage],
						}),
					],
					engineOptions: {
						logger: {
							warn: (message) => warnings.push(message),
						},
					},
					blockValidationFn: ({ renderedGroupAst }) => {
						const html = toHtml(renderedGroupAst)

						// Select the contents of all spans that do not have the default
						// dracula theme foreground color
						const spansWithColorAndContent = [...html.matchAll(/<span [^>]*?style="--0:([^"]*?)">(.*?)<\/span>/g)]
						const highlightedSpans = spansWithColorAndContent.filter((match) => match[1].toLowerCase() !== themes[0].fg.toLowerCase())
						const highlightedContents = highlightedSpans.map((match) => match[2])
						expect(highlightedContents).toEqual([
							// Keywords
							'import',
							'from',
							// Strings
							"'",
							'somewhere',
							"'",
						])

						colorAssertionExecuted = true
					},
				},
			],
		})

		expect(colorAssertionExecuted).toBe(true)

		// Ensure that no warnings were logged
		expect(warnings.join('\n')).toEqual('')
	})
	test('Allows overriding bundled languages', async ({ task: { name: testName } }) => {
		let colorAssertionExecuted = false
		const warnings: string[] = []

		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: [
				{
					fixtureName: '',
					themes,
					code: `((document\\.getElementById)|(document\\.querySelector))`,
					language: 'regexp',
					meta: '',
					plugins: [
						pluginShiki({
							langs: [regexp],
						}),
					],
					engineOptions: {
						logger: {
							warn: (message) => warnings.push(message),
						},
					},
					blockValidationFn: ({ renderedGroupAst }) => {
						const html = toHtml(renderedGroupAst)

						// Select the contents of all spans that do not have the default
						// dracula theme foreground color
						const spansWithColorAndContent = [...html.matchAll(/<span [^>]*?style="--0:([^"]*?)">(.*?)<\/span>/g)]
						const highlightedSpans = spansWithColorAndContent.filter((match) => match[1].toLowerCase() !== themes[0].fg.toLowerCase())
						const highlightedContents = highlightedSpans.map((match) => match[2])
						expect(highlightedContents).toEqual([
							// Expect the tokens provided by the custom language
							'((',
							'document',
							'\\.',
							'getElementById',
							')',
							'|',
							'(',
							'document',
							'\\.',
							'querySelector',
							'))',
						])

						colorAssertionExecuted = true
					},
				},
			],
		})

		expect(colorAssertionExecuted).toBe(true)

		// Ensure that no warnings were logged
		expect(warnings.join('\n')).toEqual('')
	})
	test('Allows adding language aliases', async ({ task: { name: testName } }) => {
		let colorAssertionExecuted = false
		const warnings: string[] = []

		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: [
				{
					fixtureName: '',
					themes,
					code: `import something from 'somewhere'`,
					language: 'mjs',
					meta: '',
					plugins: [
						pluginShiki({
							langAlias: {
								mjs: 'js',
							},
						}),
					],
					engineOptions: {
						logger: {
							warn: (message) => warnings.push(message),
						},
					},
					blockValidationFn: ({ renderedGroupAst }) => {
						const html = toHtml(renderedGroupAst)

						// Select the contents of all spans that do not have the default
						// dracula theme foreground color
						const spansWithColorAndContent = [...html.matchAll(/<span [^>]*?style="--0:([^"]*?)">(.*?)<\/span>/g)]
						const highlightedSpans = spansWithColorAndContent.filter((match) => match[1].toLowerCase() !== themes[0].fg.toLowerCase())
						const highlightedContents = highlightedSpans.map((match) => match[2])
						expect(highlightedContents).toEqual([
							// Keywords
							'import',
							'from',
							// Strings
							"'",
							'somewhere',
							"'",
						])

						colorAssertionExecuted = true
					},
				},
			],
		})

		expect(colorAssertionExecuted).toBe(true)

		// Ensure that no warnings were logged
		expect(warnings.join('\n')).toEqual('')
	})
})

describe('Supports a limited subset of Shiki transformers', { timeout: 5 * 1000 }, async () => {
	const themes = [await loadBundledShikiTheme('dracula'), await loadBundledShikiTheme('github-dark')]

	describe('Supports the "tokens" hook', () => {
		test('Allows mutating the tokens in place', async ({ task: { name: testName } }) => {
			const mutatingRedImportTransformer: ShikiTransformer = {
				tokens(tokens: ThemedToken[][]) {
					for (const line of tokens) {
						for (const token of line) {
							if (token.content === 'import') {
								token.color = 'red'
							}
						}
					}
				},
			}
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: jsTestCode,
					language: 'js',
					meta: '',
					plugins: [pluginShiki({ transformers: [mutatingRedImportTransformer] })],
					blockValidationFn: ({ renderedGroupAst }) => {
						const tokens = selectAll('span[style]', renderedGroupAst)
						const importTokens = tokens.filter((element) => toText(element) === 'import')
						expect(importTokens).toHaveLength(1)
						const inlineStyles = getInlineStyles(importTokens[0])
						expect(inlineStyles).toMatchObject(
							new Map([
								['--0', 'red'],
								['--1', 'red'],
							])
						)
					},
				}),
			})
		})

		test('Allows returning a new array of tokens', async ({ task: { name: testName } }) => {
			const stableRedImportTransformer: ShikiTransformer = {
				tokens(tokens: ThemedToken[][]) {
					return tokens.map((line) => line.map((token) => (token.content === 'import' ? { ...token, color: 'red' } : token)))
				},
			}
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: jsTestCode,
					language: 'js',
					meta: '',
					plugins: [pluginShiki({ transformers: [stableRedImportTransformer] })],
					blockValidationFn: ({ renderedGroupAst }) => {
						const tokens = selectAll('span[style]', renderedGroupAst)
						const importTokens = tokens.filter((element) => toText(element) === 'import')
						expect(importTokens).toHaveLength(1)
						const inlineStyles = getInlineStyles(importTokens[0])
						expect(inlineStyles).toMatchObject(
							new Map([
								['--0', 'red'],
								['--1', 'red'],
							])
						)
					},
				}),
			})
		})

		test('Provides a context object (this) to the hook', async ({ task: { name: testName } }) => {
			const langTransformer: ShikiTransformer = {
				tokens(this: ShikiTransformerContextSource, tokens: ThemedToken[][]) {
					for (const line of tokens) {
						line.forEach(() => {
							if (this.options.lang === 'js') {
								// Do nothing, just testing that this doesn't error
							}
						})
					}
				},
			}
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: jsTestCode,
					language: 'js',
					meta: '',
					plugins: [pluginShiki({ transformers: [langTransformer] })],
				}),
			})
		})

		test('Throws an error if the text of a line is changed', async ({ task: { name: testName } }) => {
			const uppercaseTransformer: ShikiTransformer = {
				tokens(tokens: ThemedToken[][]) {
					for (const line of tokens) {
						for (const token of line) {
							token.content = token.content.toUpperCase()
						}
					}
				},
			}

			await expect(async () => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: jsTestCode,
						language: 'js',
						meta: '',
						plugins: [pluginShiki({ transformers: [uppercaseTransformer] })],
						engineOptions: {
							logger: {
								error: () => undefined,
							},
						},
					}),
				})
			}).rejects.toThrow()
		})

		test('Throws an error if the number of lines is changed', async ({ task: { name: testName } }) => {
			const insertLineTransformer: ShikiTransformer = {
				tokens(tokens: ThemedToken[][]) {
					tokens.unshift([{ content: '// inserted line', offset: 0 }])
				},
			}
			await expect(async () => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: jsTestCode,
						language: 'js',
						meta: '',
						plugins: [pluginShiki({ transformers: [insertLineTransformer] })],
						engineOptions: {
							logger: {
								error: () => undefined,
							},
						},
					}),
				})
			}).rejects.toThrow()
		})
	})

	describe('Supports the "preprocess" hook', () => {
		test('Allows changing the "includeExplanation" option', async ({ task: { name: testName } }) => {
			const scopesTransformer: ShikiTransformer = {
				preprocess(code, options) {
					;(options as CodeToTokensOptions).includeExplanation = true
				},
				tokens(tokens: ThemedToken[][]) {
					for (const line of tokens) {
						for (const token of line) {
							if (token.explanation == null) {
								throw Error('Expected explanation')
							}
						}
					}
				},
			}
			// Just test that this doesn't throw
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: jsTestCode,
					language: 'js',
					meta: '',
					plugins: [pluginShiki({ transformers: [scopesTransformer] })],
				}),
			})
		})

		test('Throws an error if the code is changed', async ({ task: { name: testName } }) => {
			const uppercaseTransformer: ShikiTransformer = {
				preprocess(code) {
					return code.toUpperCase()
				},
			}
			// Just test that this doesn't throw
			await expect(async () => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: jsTestCode,
						language: 'js',
						meta: '',
						plugins: [pluginShiki({ transformers: [uppercaseTransformer] })],
						engineOptions: {
							logger: {
								error: () => undefined,
							},
						},
					}),
				})
			}).rejects.toThrow()
		})
	})

	test('Throws an error if transformers include unsupported hooks', async ({ task: { name: testName } }) => {
		const spanTransformer: ShikiTransformer = {
			span() {
				// Do nothing, just the existence of this hook should cause an error
			},
		}
		// Just test that this doesn't throw
		await expect(async () => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: jsTestCode,
					language: 'js',
					meta: '',
					plugins: [pluginShiki({ transformers: [spanTransformer] })],
				}),
			})
		}).rejects.toThrow()
	})
})

function validateHighlighting(html: string, theme: ExpressiveCodeTheme, expectedContents: string[], exact: boolean) {
	// Select the contents of all spans that do not have the default
	// dracula theme foreground color
	const spansWithColorAndContent = [...html.matchAll(/<span [^>]*?style="--0:([^"]*?)">(.*?)<\/span>/g)]
	const highlightedSpans = spansWithColorAndContent.filter((match) => match[1].toLowerCase() !== theme.fg.toLowerCase())
	const highlightedContents = highlightedSpans.map((match) => match[2])
	if (exact) {
		expect(highlightedContents).toEqual(expectedContents)
	} else {
		expectedContents.forEach((content) => {
			expect(highlightedContents).toContain(content)
		})
	}
}
