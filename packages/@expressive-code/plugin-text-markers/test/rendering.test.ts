import { describe, test } from 'vitest'
import { ExpressiveCodeTheme } from '@expressive-code/core'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures } from '@internal/test-utils'
import { textMarkers } from '../src'

describe('Renders text markers', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	const inlineMarkerTestText = `
---
const { greeting = "Hello", name = "Astronaut" } = Astro.props;
---
<h2>{greeting}, punymighty {name}!</h2>
	`.trim()

	test(`Line-level markers`, async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: `
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    extendDefaultPlugins: false,
    smartypants: false,
    gfm: false,
  }
});
				`.trim(),
				meta: `del={5} ins={6-7}`,
				plugins: [textMarkers()],
			}),
		})
		// TODO: Actually add validations for the AST
	})

	test(`Inline plaintext markers`, async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: inlineMarkerTestText,
				language: 'astro',
				meta: `title="src/components/GreetingHeadline.astro" mark='= "Hello"' "= \\"Astronaut\\"" del="puny" ins='mighty'`,
				plugins: [textMarkers()],
			}),
		})
		// TODO: Actually add validations for the AST
	})

	test(`Inline RegExp markers`, async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: inlineMarkerTestText,
				language: 'astro',
				meta: `title="src/components/GreetingHeadline.astro" mark=/{\\w+?}/ ins=/(?<={.*?)(= ".*?")(?=.*?})/`,
				plugins: [textMarkers()],
			}),
		})
		// TODO: Actually add validations for the AST
	})

	test(`Combined line and inline plaintext markers`, async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: inlineMarkerTestText,
				language: 'astro',
				meta: `title="src/components/GreetingHeadline.astro" mark={4} mark='= "Hello"' "= \\"Astronaut\\"" del="puny" ins='mighty'`,
				plugins: [textMarkers()],
			}),
		})
		// TODO: Actually add validations for the AST
	})
})

// function validateBlockAst({
// 	renderedGroupAst,
// 	figureSelector,
// 	title,
// 	srTitlePresent,
// }: {
// 	renderedGroupAst: Parent
// 	figureSelector: string
// 	title?: string
// 	srTitlePresent: boolean
// }) {
// 	// // Expect the AST to only contain a single figure element
// 	// const figures = selectAll('figure', renderedGroupAst)
// 	// expect(figures).toHaveLength(1)
// 	// // Expect our figure wrapper to match the given selector
// 	// expect(matches(figureSelector, figures[0])).toEqual(true)
// 	// // Ensure that there is a header (we always render it for styling)
// 	// expect(selectAll('figure > figcaption.header', renderedGroupAst)).toHaveLength(1)
// 	// // Check visible title
// 	// const titles = selectAll('figure > figcaption.header > span.title', renderedGroupAst)
// 	// expect(titles).toHaveLength(title ? 1 : 0)
// 	// if (title) {
// 	// 	expect(titles[0].children[0].type === 'text' ? titles[0].children[0].value : '').toEqual(title)
// 	// }
// 	// // Check screen reader-only title
// 	// expect(selectAll('figure > figcaption.header > span.sr-only', renderedGroupAst)).toHaveLength(srTitlePresent ? 1 : 0)
// 	// // Expect the figcaption to be followed by a pre element
// 	// expect(select('figure > figcaption + pre', renderedGroupAst)).toBeTruthy()
// }
