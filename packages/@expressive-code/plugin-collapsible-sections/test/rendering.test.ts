import { describe, test, expect } from 'vitest'
import { getClassNames, select, selectAll, toText } from '@expressive-code/core/hast'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, TestFixture, loadTestThemes } from '@internal/test-utils'
import { pluginCollapsibleSections, pluginCollapsibleSectionsTexts } from '../src'
import { Section } from '../src/utils'
import { collapsibleSectionClass } from '../src/styles'

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

const longTestText = `
// All this boilerplate setup code will be collapsed
import { someBoilerplateEngine } from '@example/some-boilerplate'
import { evenMoreBoilerplate } from '@example/even-more-boilerplate'

const engine = someBoilerplateEngine(evenMoreBoilerplate())

// This part of the code will be visible by default
engine.doSomething(1, 2, 3, calcFn)

function calcFn() {
  // You can have multiple collapsed sections
  const a = 1
  const b = 2
  const c = a + b

  // This will remain visible
  console.log(\`Calculation result: \${a} + \${b} = \${c}\`)
  return c
}

// All this code until the end of the block will be collapsed again
engine.closeConnection()
engine.freeMemory()
engine.shutdown({ reason: 'End of example boilerplate code' })
`.trim()

const longTestMeta = 'ins={3} collapse={1-5, 12-14, 21-24}'

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
					blockValidationFn: buildBlockValidationFn([
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
					blockValidationFn: buildBlockValidationFn([
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
					blockValidationFn: buildBlockValidationFn([{ from: 5, to: 9, text: '5 collapsed lines' }]),
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
					blockValidationFn: buildBlockValidationFn([
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
					engineOptions: {
						defaultLocale: 'xy',
						styleOverrides: {
							collapsibleSections: {
								openBorderColor: ({ resolveSetting }) => resolveSetting('collapsibleSections.closedBorderColor'),
								openBackgroundColor: ({ resolveSetting }) => resolveSetting('collapsibleSections.openBackgroundColorFoldable'),
							},
						},
					},
					code: lineMarkerTestText,
					meta: `collapse={5-7,1-4} collapsePreserveIndent=false`,
					plugins: [pluginCollapsibleSections()],
					blockValidationFn: buildBlockValidationFn([
						{ from: 1, to: 4, text: 'Test 4' },
						{ from: 5, to: 7, text: 'Test 3' },
					]),
				}),
			})
		})

		test(`Supports foldable styles`, { timeout: 5 * 1000 }, async ({ task: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: longTestText,
					meta: longTestMeta + ' collapseStyle=foldable-auto',
					plugins: [pluginShiki(), pluginTextMarkers(), pluginCollapsibleSections()],
					blockValidationFn: ({ renderedGroupAst }) => {
						const codeAst = select('pre > code', renderedGroupAst)
						if (!codeAst) throw new Error("Couldn't find code AST")

						// Expect 3 div wrappers with the correct class name
						const wrappers = selectAll(`div.${collapsibleSectionClass}`, codeAst)
						expect(wrappers).toHaveLength(3)

						// Expect the correct foldable style classes on the wrappers
						// based on their location in the code snippet
						const styleClasses = wrappers.map((wrapper) =>
							getClassNames(wrapper)
								.filter((className) => className.startsWith('foldable-'))
								.join(',')
						)
						expect(styleClasses).toEqual(['foldable-top', 'foldable-top', 'foldable-bottom'])
					},
				}),
			})
		})
	})
})

type ExpectedSection = Omit<Section, 'lines'> & {
	text: string
}

function buildBlockValidationFn(expectedSections: ExpectedSection[]): NonNullable<TestFixture['blockValidationFn']> {
	return ({ renderedGroupAst }) => {
		const codeAst = select('pre > code', renderedGroupAst)
		if (!codeAst) throw new Error("Couldn't find code AST when validating collapsed sections")

		const actualSections: ExpectedSection[] = []
		let i = 0
		codeAst.children.forEach((child) => {
			if ('tagName' in child && child.tagName.toLowerCase() === 'details') {
				// Child is a section containing <summary> and a number of lines
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
