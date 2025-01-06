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

		test(`Correctly handles code with text-markers and syntax highlighting`, { timeout: 5 * 1000 }, async ({ task: { name: testName } }) => {
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
		})

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

		test(`Shows collapse button when showCollapseButton is true`, async ({ task: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: lineMarkerTestText,
					meta: `collapse={5-7,1-4} showCollapseButton=true`,
					plugins: [pluginCollapsibleSections()],
					blockValidationFn: ({ renderedGroupAst }) => {
						const codeAst = select('pre > code', renderedGroupAst)
						if (!codeAst) throw new Error("Couldn't find code AST")
						
						// Find all details elements
						const details = codeAst.children.filter(
							child => 'tagName' in child && child.tagName === 'details'
						)

						// Should have 2 sections
						expect(details).toHaveLength(2)
						
						// Check that each details element has a collapse button
						details.forEach(detail => {
							if (!('children' in detail)) return
							
							// The collapse button should be the last child after the summary and content
							const lastChild = detail.children[detail.children.length - 1]
							if (!('properties' in lastChild)) {
								throw new Error('Last child is not an element')
							}

							const properties = lastChild.properties || {}
							// className in AST is an array of classes
							expect(Array.isArray(properties.className)).toBe(true)
							expect(properties.className).toContain('collapse-button')
							expect(properties.onClick).toBe('this.parentElement.removeAttribute("open")')
						})
					},
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
