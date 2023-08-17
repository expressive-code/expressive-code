import { describe, test, expect } from 'vitest'
// import { selectAll } from 'hast-util-select'
// import { toText } from 'hast-util-to-text'
import { ExpressiveCodeTheme } from '@expressive-code/core'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures, TestFixture } from '@internal/test-utils'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { select } from 'hast-util-select'
import { pluginCollapsibleSections } from '../src'
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

describe('Renders collapsed sections', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	describe('Collapsed lines', () => {
		test(`Collapses the expected lines`, async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: lineMarkerTestText,
					meta: `collapse={1-4}`,
					plugins: [pluginShiki(), pluginCollapsibleSections()],
					blockValidationFn: buildMarkerValidationFn([{ from: 1, to: 4 }]),
				}),
			})
		})

		test(`Correctly targets lines when code block starts with empty lines`, async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: `\n\t\n  \n${lineMarkerTestText}`,
					meta: `del={5} ins={6-7} mark={1,2} collapse={2-2, 5-7}`,
					plugins: [pluginShiki(), pluginTextMarkers(), pluginCollapsibleSections()],
					blockValidationFn: buildMarkerValidationFn([
						{ from: 2, to: 2 },
						{ from: 5, to: 7 },
					]),
				}),
			})
		})
	})
})

function buildMarkerValidationFn(expectedSections: Section[]): NonNullable<TestFixture['blockValidationFn']> {
	return ({ renderedGroupAst }) => {
		const codeAst = select('pre > code', renderedGroupAst)
		if (!codeAst) throw new Error("Couldn't find code AST when validating collapsed sections")

		const actualSections: Section[] = []
		let i = 0
		codeAst.children.forEach((child) => {
			if ('tagName' in child && child.tagName.toLowerCase() === 'details') {
				// child is a section, containing <summary> and a number of lines
				if (!select('summary', child)) throw new Error(`Couldn't find summary in section at index ${i}`)

				const numLines = child.children.length - 1
				const from = i + 1
				actualSections.push({ from, to: from + numLines - 1 })

				i += numLines
			} else {
				++i
			}
		})

		expect(actualSections).toMatchObject(expectedSections)
	}
}
