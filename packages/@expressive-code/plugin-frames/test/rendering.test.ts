import { describe, expect, test } from 'vitest'
import { Parent } from 'hast-util-to-html/lib/types'
import { matches, select, selectAll } from 'hast-util-select'
import { ExpressiveCodeTheme } from '@expressive-code/core'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures } from '@internal/test-utils'
import { pluginFrames } from '../src'

const exampleCode = `
const btn = document.getElementById('btn')
btn.addEventListener('click', () => console.log('Hello World!'))
`.trim()

const exampleTerminalCode = `
pnpm i --save-dev expressive-code some-other-package yet-another-package 
`.trim()

describe('Renders frames around the code', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
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
	test('Single JS block with title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
// test.config.mjs

${exampleCode}
				`.trim(),
				plugins: [pluginFrames()],
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
	})
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
	test('Single terminal block with title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleTerminalCode,
				language: 'shell',
				meta: 'title="Installing Expressive Code"',
				plugins: [pluginFrames()],
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

	// Expect the figcaption to be followed by the copy button wrapper
	expect(select('figure > figcaption + .copy', renderedGroupAst)).toBeTruthy()

	// Expect the copy button wrapper to be followed by a pre element
	expect(select('.copy + pre', renderedGroupAst)).toBeTruthy()
}
