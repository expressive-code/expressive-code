import { describe, expect, test } from 'vitest'
import { Parent } from 'hast-util-to-html/lib/types'
import { matches, select, selectAll } from 'hast-util-select'
import { ExpressiveCodeTheme, StyleOverrides } from '@expressive-code/core'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures } from '@internal/test-utils'
import { pluginShiki, loadShikiTheme } from '@expressive-code/plugin-shiki'
import { pluginFrames } from '../src'

const exampleCode = `
const btn = document.getElementById('btn')
btn.addEventListener('click', () => console.log('Hello World!'))
`.trim()

const exampleTerminalCode = `
pnpm i --save-dev expressive-code some-other-package yet-another-package 
`.trim()

describe('Renders frames around the code', async () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)

	// Add a few shiki themes
	themes.unshift(await loadShikiTheme('nord'))
	themes.unshift(await loadShikiTheme('dracula'))
	themes.unshift(await loadShikiTheme('material-theme'))
	themes.unshift(await loadShikiTheme('github-light'))
	// Add the default theme
	themes.unshift(undefined)

	test('Single JS block without title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleCode,
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title):not(.is-terminal)',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
	test(
		'Single JS block with title',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: `
// test.config.mjs

${exampleCode}
				`.trim(),
					plugins: [pluginShiki(), pluginFrames()],
					blockValidationFn: ({ renderedGroupAst }) => {
						validateBlockAst({
							renderedGroupAst,
							figureSelector: '.frame.has-title:not(.is-terminal)',
							title: 'test.config.mjs',
							srTitlePresent: false,
						})
					},
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)
	test('Single terminal block without title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleTerminalCode,
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame.is-terminal:not(.has-title)',
						title: '',
						srTitlePresent: true,
					})
				},
			}),
		})
	})
	test(
		'Single terminal block with title',
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: exampleTerminalCode,
					language: 'shell',
					meta: 'title="Installing Expressive Code"',
					plugins: [pluginShiki(), pluginFrames()],
					blockValidationFn: ({ renderedGroupAst }) => {
						validateBlockAst({
							renderedGroupAst,
							figureSelector: '.frame.has-title.is-terminal',
							title: 'Installing Expressive Code',
							srTitlePresent: false,
						})
					},
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)

	describe('Allows customizing the frame using styleOverrides', () => {
		const runStyleOverridesTest = async (testName: string, styleOverrides: Partial<StyleOverrides>) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: `
// test.config.mjs

${exampleCode}
					`.trim(),
					plugins: [pluginFrames()],
					engineOptions: {
						styleOverrides,
					},
					blockValidationFn: ({ renderedGroupAst }) => {
						validateBlockAst({
							renderedGroupAst,
							figureSelector: '.frame.has-title:not(.is-terminal)',
							title: 'test.config.mjs',
							srTitlePresent: false,
						})
					},
				}),
			})
		}

		test('Style with thick borders', async ({ meta: { name: testName } }) => {
			await runStyleOverridesTest(testName, {
				borderWidth: '3px',
			})
		})

		test('Style without tab bar background', async ({ meta: { name: testName } }) => {
			await runStyleOverridesTest(testName, {
				frames: {
					editorTabBarBackground: 'transparent',
					editorTabBarBorderColor: 'transparent',
					editorTabBarBorderBottom: ({ coreStyles }) => coreStyles.borderColor,
					editorActiveTabBorder: ({ coreStyles }) => coreStyles.borderColor,
					shadowColor: 'transparent',
				},
			})
		})
	})
})

describe('Differentiates between terminal and code editor frames', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	test('Renders a shell script with shebang as frame="code"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
#!/bin/sh
${exampleTerminalCode}
				`.trim(),
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title):not(.is-terminal)',
						srTitlePresent: false,
					})
				},
			}),
		})
	})

	test('Renders a shell script with file name comment as frame="code"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
# install.sh
${exampleTerminalCode}
				`.trim(),
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame.has-title:not(.is-terminal)',
						title: 'install.sh',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
})

describe('Allows changing the frame type to "terminal" using meta information', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	test('Change JS block without title to frame="terminal"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleCode,
				meta: 'frame="terminal"',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title).is-terminal',
						title: '',
						srTitlePresent: true,
					})
				},
			}),
		})
	})
	test('Change JS block with title to frame="terminal"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
// test.config.mjs

${exampleCode}
				`.trim(),
				meta: 'frame="terminal"',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame.has-title.is-terminal',
						title: 'test.config.mjs',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
	test('Change shell script block with title to frame="terminal"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
#!/bin/sh
# install.sh
${exampleTerminalCode}
				`.trim(),
				meta: 'frame="terminal"',
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame.has-title.is-terminal',
						title: 'install.sh',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
})

describe('Allows changing the frame type to "code" using meta information', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	test('Change terminal block without title to frame="code"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleTerminalCode,
				meta: 'frame="code"',
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title):not(.is-terminal)',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
})

describe('Allows changing the frame type to "none" using meta information', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	test('Change JS block without title to frame="none"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleCode,
				meta: 'frame="none"',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title):not(.is-terminal)',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
	test('Change JS block with title to frame="none"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
// test.config.mjs

${exampleCode}
				`.trim(),
				meta: 'frame="none"',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title):not(.is-terminal)',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
	test('Change terminal block without title to frame="none"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleTerminalCode,
				meta: 'frame="none"',
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title):not(.is-terminal)',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
	test('Change terminal block with title to frame="none"', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
#!/bin/sh
# install.sh
${exampleTerminalCode}
				`.trim(),
				meta: 'frame="none"',
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						figureSelector: '.frame:not(.has-title):not(.is-terminal)',
						srTitlePresent: false,
					})
				},
			}),
		})
	})
})

function validateBlockAst({
	renderedGroupAst,
	figureSelector,
	title,
	srTitlePresent,
}: {
	renderedGroupAst: Parent
	figureSelector: string
	title?: string | undefined
	srTitlePresent: boolean
}) {
	// Expect the AST to only contain a single figure element
	const figures = selectAll('figure', renderedGroupAst)
	expect(figures).toHaveLength(1)

	// Expect our figure wrapper to match the given selector
	expect(matches(figureSelector, figures[0])).toEqual(true)

	// Ensure that there is a header (we always render it for styling)
	expect(selectAll('figure > figcaption.header', renderedGroupAst)).toHaveLength(1)

	// Check visible title
	const titles = selectAll('figure > figcaption.header > span.title', renderedGroupAst)
	expect(titles).toHaveLength(title !== undefined ? 1 : 0)
	if (title !== undefined) {
		expect(titles[0].children[0].type === 'text' ? titles[0].children[0].value : '').toEqual(title)
	}

	// Check screen reader-only title
	expect(selectAll('figure > figcaption.header > span.sr-only', renderedGroupAst)).toHaveLength(srTitlePresent ? 1 : 0)

	// Expect the figcaption to be followed by the pre element
	expect(select('figure > figcaption + pre', renderedGroupAst)).toBeTruthy()

	// Expect the pre element to be followed by the copy button wrapper
	expect(select('pre + .copy', renderedGroupAst)).toBeTruthy()
}
