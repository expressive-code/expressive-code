import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngineConfig, ExpressiveCodeTheme, ResolvedStyleSettingsByPath } from '@expressive-code/core'
import type { Parents } from '@expressive-code/core/hast'
import { matches, select, selectAll } from '@expressive-code/core/hast'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, parseCss, findDeclsBySelectorAndProperty, loadTestThemes } from '@internal/test-utils'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { pluginFrames } from '../src'

const exampleCode = `
const btn = document.getElementById('btn')
btn.addEventListener('click', () => console.log('Hello World!'))
`.trim()

const exampleTerminalCode = `
pnpm i --save-dev expressive-code some-other-package yet-another-package 
`.trim()

describe('Renders frames around the code', async () => {
	const themes = await loadTestThemes()

	test('Single JS block without title', async ({ task: { name: testName } }) => {
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
		async ({ task: { name: testName } }) => {
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
	test('Single terminal block without title', async ({ task: { name: testName } }) => {
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
		async ({ task: { name: testName } }) => {
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
		const runStyleOverridesTest = async ({
			testName,
			engineOptions,
			expectedStyleMatches,
		}: {
			testName: string
			engineOptions: Partial<ExpressiveCodeEngineConfig>
			expectedStyleMatches: ({
				theme,
				resolvedStyleSettings,
			}: {
				theme: ExpressiveCodeTheme
				resolvedStyleSettings: ResolvedStyleSettingsByPath
			}) => { selector: string | RegExp; property: string | RegExp; value: string | RegExp }[]
		}) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: `
// test.config.mjs

${exampleCode}
					`.trim(),
					plugins: [pluginFrames()],
					engineOptions,
					blockValidationFn: ({ renderedGroupAst, baseStyles, styleVariants }) => {
						validateBlockAst({
							renderedGroupAst,
							figureSelector: '.frame.has-title:not(.is-terminal)',
							title: 'test.config.mjs',
							srTitlePresent: false,
						})
						const css = parseCss(baseStyles)
						styleVariants.forEach(({ theme, resolvedStyleSettings, cssVarDeclarations }) => {
							expectedStyleMatches({ theme, resolvedStyleSettings }).forEach((expectedStyleMatch) => {
								const { selector, property, value } = expectedStyleMatch
								const decls = findDeclsBySelectorAndProperty(css, selector, property)
								const resolvedDeclValues = decls.map((decl) => {
									let value = decl.value
									cssVarDeclarations.forEach((cssVarValue, cssVarName) => {
										value = value.replace(new RegExp(`var\\(${cssVarName}\\)`, 'g'), cssVarValue)
									})
									return value
								})
								const declValueMatches = resolvedDeclValues.filter((declValue) => {
									return value instanceof RegExp ? declValue.match(value) : declValue === value
								})
								expect(
									declValueMatches.length >= 1,
									`Expected style did not match: selector=${selector.toString()}, property=${property.toString()}, value=${value.toString()}, resolvedDeclValues=${JSON.stringify(
										resolvedDeclValues
									)}`
								).toBeTruthy()
							})
						})
					},
				}),
			})
		}

		test('Style with thick borders', async ({ task: { name: testName } }) => {
			await runStyleOverridesTest({
				testName,
				engineOptions: {
					styleOverrides: {
						borderWidth: '3px',
					},
				},
				expectedStyleMatches: () => [
					{
						selector: / pre$/,
						property: 'border',
						value: /^3px solid/,
					},
				],
			})
		})

		test('Style without tab bar background', async ({ task: { name: testName } }) => {
			await runStyleOverridesTest({
				testName,
				engineOptions: {
					styleOverrides: {
						frames: {
							editorTabBarBackground: 'transparent',
							editorTabBarBorderColor: 'transparent',
							editorTabBarBorderBottomColor: ({ resolveSetting }) => resolveSetting('borderColor'),
							editorActiveTabBorderColor: ({ resolveSetting }) => resolveSetting('borderColor'),
							shadowColor: 'transparent',
						},
					},
				},
				expectedStyleMatches: ({ resolvedStyleSettings }) => [
					// Validate editorTabBarBackground
					{
						selector: / .header$/,
						property: 'background',
						value: /linear-gradient\(transparent, transparent\)/,
					},
					// Validate editorTabBarBorderBottom
					{
						selector: / .header$/,
						property: 'background',
						value: new RegExp(`^linear-gradient\\(to top,\\s*${resolvedStyleSettings.get('borderColor') ?? '-'} `),
					},
					// Validate shadowColor
					{
						selector: / .frame$/,
						property: 'box-shadow',
						value: /transparent$/,
					},
				],
			})
		})

		test('Style overwritten by theme', async ({ task: { name: testName } }) => {
			await runStyleOverridesTest({
				testName,
				engineOptions: {
					customizeTheme: (theme) => {
						theme = new ExpressiveCodeTheme(theme)
						theme.styleOverrides.frames = {
							editorTabBorderRadius: '0.75rem',
						}
						return theme
					},
					styleOverrides: {
						borderRadius: '0px',
						frames: {
							editorTabBarBackground: 'transparent',
							editorTabBarBorderColor: 'transparent',
							editorTabBarBorderBottomColor: ({ resolveSetting }) => resolveSetting('borderColor'),
							editorActiveTabBorderColor: ({ resolveSetting }) => resolveSetting('borderColor'),
							shadowColor: 'transparent',
						},
					},
				},
				expectedStyleMatches: () => [
					{
						selector: / pre$/,
						property: 'border-radius',
						value: /0px/,
					},
					{
						selector: / .frame$/,
						property: '--tab-border-radius',
						value: /0\.75rem/,
					},
				],
			})
		})
	})
})

describe('Differentiates between terminal and code editor frames', async () => {
	const themes = await loadTestThemes()

	test('Renders a shell script with shebang as frame="code"', async ({ task: { name: testName } }) => {
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

	test('Renders a shell script with file name comment as frame="code"', async ({ task: { name: testName } }) => {
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

describe('Allows changing the frame type to "terminal" using meta information', async () => {
	const themes = await loadTestThemes()

	test('Change JS block without title to frame="terminal"', async ({ task: { name: testName } }) => {
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
	test('Change JS block with title to frame="terminal"', async ({ task: { name: testName } }) => {
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
	test('Change shell script block with title to frame="terminal"', async ({ task: { name: testName } }) => {
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

describe('Allows changing the frame type to "code" using meta information', async () => {
	const themes = await loadTestThemes()

	test('Change terminal block without title to frame="code"', async ({ task: { name: testName } }) => {
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

describe('Allows changing the frame type to "none" using meta information', async () => {
	const themes = await loadTestThemes()

	test('Change JS block without title to frame="none"', async ({ task: { name: testName } }) => {
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
	test('Change JS block with title to frame="none"', async ({ task: { name: testName } }) => {
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
	test('Change terminal block without title to frame="none"', async ({ task: { name: testName } }) => {
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
	test('Change terminal block with title to frame="none"', async ({ task: { name: testName } }) => {
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
	renderedGroupAst: Parents
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
