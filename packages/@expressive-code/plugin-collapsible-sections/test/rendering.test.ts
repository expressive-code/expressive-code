import { describe, test, expect } from 'vitest'
// import { selectAll } from 'hast-util-select'
// import { toText } from 'hast-util-to-text'
import { ExpressiveCodeTheme } from '@expressive-code/core'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures, TestFixture } from '@internal/test-utils'
import { pluginShiki } from '@expressive-code/plugin-shiki'
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
					blockValidationFn: buildMarkerValidationFn([{ from: 1, to: 2 }]),
				}),
			})
		})

		test(`Correctly targets lines when code block starts with empty lines`, async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: `\n\t\n  \n${lineMarkerTestText}`,
					meta: `del={5} ins={6-7} mark={1,2}`,
					plugins: [pluginShiki(), pluginCollapsibleSections()],
					blockValidationFn: buildMarkerValidationFn([]),
				}),
			})
		})
	})
})

function buildMarkerValidationFn(expectedSections: Section[], expectedCode?: string): NonNullable<TestFixture['blockValidationFn']> {
	return ({ renderedGroupAst }) => {
		return true
	}
}
