import { describe, test, expect } from 'vitest'
import { select, toText } from '@expressive-code/core/hast'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, TestFixture, loadTestThemes } from '@internal/test-utils'
import { pluginCollapsibleSections, pluginCollapsibleSectionsTexts } from '../src'
import { Section } from '../src/utils'

const lineMarkerTestText = `
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    extendDefaultPlugins: false,
    smartypants: false,
    gfm: false,
  }
});
`.trim()

describe('Renders collapsed sections', async () => {
	const themes = await loadTestThemes()

	describe('Collapsed lines', () => {
		test(`Collapses the expected lines`, async ({ task: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: lineMarkerTestText,
					meta: `collapse={5-7,1-4}`,
					plugins: [pluginCollapsibleSections()],
					blockValidationFn: buildMarkerValidationFn([
						{ from: 1, to: 4, text: '4 collapsed lines' },
						{ from: 5, to: 7, text: '3 collapsed lines' },
					]),
				}),
			})
		})

		test(`Correctly targets lines when code block starts with empty lines`, async ({ task: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: `\n\t\n  \n${lineMarkerTestText}`,
					meta: `collapse={2-2, 5-7}`,
					plugins: [pluginCollapsibleSections()],
					blockValidationFn: buildMarkerValidationFn([
						{ from: 2, to: 2, text: '1 collapsed line' },
						{ from: 5, to: 7, text: '3 collapsed lines' },
					]),
				}),
			})
		})

		test(`Correctly limits sections to the boundaries of the code sample`, async ({ task: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: lineMarkerTestText,
					meta: `collapse={5-12}`,
					plugins: [pluginCollapsibleSections()],
					blockValidationFn: buildMarkerValidationFn([{ from: 5, to: 9, text: '5 collapsed lines' }]),
				}),
			})
		})

		test(
			`Correctly handles code with text-markers and syntax highlighting`,
			async ({ task: { name: testName } }) => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: `\n\t\n  \n${lineMarkerTestText}`,
						meta: `del={5} ins={6-7} mark={1,2} collapse={2-2, 5-7}`,
						plugins: [pluginShiki(), pluginTextMarkers(), pluginCollapsibleSections()],
						engineOptions: {
							styleOverrides: {
								collapsibleSections: {
									closedBorderWidth: '1px',
								},
							},
						},
						blockValidationFn: buildMarkerValidationFn([
							{ from: 2, to: 2, text: '1 collapsed line' },
							{ from: 5, to: 7, text: '3 collapsed lines' },
						]),
					}),
				})
			},
			{ timeout: 5 * 1000 }
		)

		test(`Uses the correct section summary if given as option`, async ({ task: { name: testName } }) => {
			pluginCollapsibleSectionsTexts.addLocale('xy', { collapsedLines: 'Test {lineCount}' })
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					engineOptions: { defaultLocale: 'xy' },
					code: lineMarkerTestText,
					meta: `collapse={5-7,1-4} collapsePreserveIndent=false`,
					plugins: [pluginCollapsibleSections()],
					blockValidationFn: buildMarkerValidationFn([
						{ from: 1, to: 4, text: 'Test 4' },
						{ from: 5, to: 7, text: 'Test 3' },
					]),
				}),
			})
		})
	})
})

type ExpectedSection = Omit<Section, 'lines'> & {
	text: string
}

function buildMarkerValidationFn(expectedSections: ExpectedSection[]): NonNullable<TestFixture['blockValidationFn']> {
	return ({ renderedGroupAst }) => {
		const codeAst = select('pre > code', renderedGroupAst)
		if (!codeAst) throw new Error("Couldn't find code AST when validating collapsed sections")

		const actualSections: ExpectedSection[] = []
		let i = 0
		codeAst.children.forEach((child) => {
			if ('tagName' in child && child.tagName.toLowerCase() === 'details') {
				// child is a section, containing <summary> and a number of lines
				const $summary = select('summary', child)
				if (!$summary) throw new Error(`Couldn't find summary in section at index ${i}`)

				const numLines = child.children.length - 1
				const from = i + 1
				actualSections.push({ from, to: from + numLines - 1, text: toText($summary) })

				i += numLines
			} else {
				++i
			}
		})

		expect(actualSections).toMatchObject(expectedSections)
	}
}
