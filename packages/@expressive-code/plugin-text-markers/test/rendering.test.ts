import { describe, test, expect } from 'vitest'
import { selectAll } from 'hast-util-select'
import { toText } from 'hast-util-to-text'
import { AnnotationRenderPhase, ExpressiveCodePlugin, ExpressiveCodeTheme, InlineStyleAnnotation } from '@expressive-code/core'
import { pluginShiki, loadShikiTheme } from '@expressive-code/plugin-shiki'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures, TestFixture } from '@internal/test-utils'
import { pluginTextMarkers } from '../src'
import { MarkerType, MarkerTypeOrder } from '../src/marker-types'
import { actualDiff, indentedJsCodeWithDiffMarkers, jsCodeWithDiffMarkers } from './data/diff-examples'

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

const inlineMarkerTestText = `
---
const { greeting = "Hello", name = "Astronaut" } = Astro.props;
---
<h2>{greeting}, punymighty {name}!</h2>
`.trim()

describe('Renders text markers', async () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)

	// Add two shiki themes
	themes.unshift(await loadShikiTheme('dracula'))
	themes.unshift(await loadShikiTheme('material-theme'))
	themes.unshift(await loadShikiTheme('github-light'))
	// Add the default theme
	themes.unshift(undefined)

	describe('Line-level markers', () => {
		test(`Marks the expected lines`, async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: lineMarkerTestText,
					meta: `del={5} ins={6-7} mark={1,2}`,
					plugins: [pluginTextMarkers()],
					blockValidationFn: buildMarkerValidationFn([
						{ fullLine: true, markerType: 'mark', text: `import { defineConfig } from 'astro/config';` },
						{ fullLine: true, markerType: 'mark', text: '' },
						{ fullLine: true, markerType: 'del', text: '    extendDefaultPlugins: false,' },
						{ fullLine: true, markerType: 'ins', text: '    smartypants: false,' },
						{ fullLine: true, markerType: 'ins', text: '    gfm: false,' },
					]),
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
					plugins: [pluginTextMarkers()],
					blockValidationFn: buildMarkerValidationFn([
						{ fullLine: true, markerType: 'mark', text: `import { defineConfig } from 'astro/config';` },
						{ fullLine: true, markerType: 'mark', text: '' },
						{ fullLine: true, markerType: 'del', text: '    extendDefaultPlugins: false,' },
						{ fullLine: true, markerType: 'ins', text: '    smartypants: false,' },
						{ fullLine: true, markerType: 'ins', text: '    gfm: false,' },
					]),
				}),
			})
		})
	})

	describe('Inline markers', () => {
		test(`Inline plaintext markers`, async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: inlineMarkerTestText,
					language: 'astro',
					meta: `title="src/components/GreetingHeadline.astro" mark='= "Hello"' "= \\"Astronaut\\"" del="puny" ins='mighty'`,
					plugins: [pluginTextMarkers()],
					blockValidationFn: buildMarkerValidationFn([
						{ markerType: 'mark', text: '= "Hello"' },
						{ markerType: 'mark', text: '= "Astronaut"' },
						{ markerType: 'del', text: 'puny' },
						{ markerType: 'ins', text: 'mighty' },
					]),
				}),
			})
		})

		test(`Inline RegExp markers`, async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: inlineMarkerTestText,
					language: 'astro',
					meta: `title="src/components/GreetingHeadline.astro" mark=/{\\w+?}/ ins=/(?<={.*?)= (".*?")(?=.*?})/`,
					plugins: [pluginTextMarkers()],
					blockValidationFn: buildMarkerValidationFn([
						// Expect RegExp matches including capture groups to only mark
						// the capture group contents, not the entire text of the match
						{ markerType: 'ins', text: '"Hello"' },
						{ markerType: 'ins', text: '"Astronaut"' },
						// Expect RegExp matches without capture groups to mark the
						// entire text of the match, and check that the backslash in `\w` worked
						{ markerType: 'mark', text: '{greeting}' },
						{ markerType: 'mark', text: '{name}' },
					]),
				}),
			})
		})

		describe(`Handles inline markers intersecting with other annotations`, () => {
			test(`Other annotations rendered earlier are split`, async ({ meta: { name: testName } }) => {
				const colors1 = ['#a4ccff', '#2090ff']
				const colors2 = ['#ffa4cc', '#ff2090']
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: inlineMarkerTestText,
						language: 'astro',
						meta: `title="src/components/GreetingHeadline.astro" mark='= "Hello"' "= \\"Astronaut\\"" del="puny" ins='mighty'`,
						plugins: [
							pseudoSyntaxHighlighter({
								highlights: [
									// Highlight starts and ends outside of "puny",
									// but ends inside of "mighty"
									{ text: '{greeting}, punymig', colors: colors1 },
									// Highlight starts inside of "mighty" and ends outside
									{ text: 'hty {name}!', colors: colors2 },
								],
							}),
							pluginTextMarkers(),
						],
						blockValidationFn: ({ renderedGroupAst, theme }) => {
							// Expect that the correct texts were marked
							const validateMarkers = buildMarkerValidationFn([
								{ markerType: 'mark', text: '= "Hello"' },
								{ markerType: 'mark', text: '= "Astronaut"' },
								{ markerType: 'del', text: 'puny' },
								// Expect that this marker was not split
								{ markerType: 'ins', text: 'mighty' },
							])
							validateMarkers({ renderedGroupAst, theme })

							// Expect that the highlights were split correctly
							const matchingElements = selectAll(`span[style]`, renderedGroupAst)
							const actualHighlights = matchingElements.map((highlight) => {
								const text = toText(highlight)
								return {
									text,
									color: highlight.properties?.style?.toString().match(/color:(#.*?)(;|$)/)?.[1],
								}
							})
							const typeColorIdx = theme.type === 'dark' ? 0 : 1
							expect(actualHighlights).toMatchObject([
								{ text: '{greeting}, ', color: colors1[typeColorIdx] },
								{ text: 'puny' },
								{ text: 'mig' },
								{ text: 'hty' },
								{ text: ' {name}!', color: colors2[typeColorIdx] },
							])
						},
					}),
				})
			})
			test(`Other annotations rendered later split markers`, async ({ meta: { name: testName } }) => {
				const colors1 = ['#a4ccff', '#2090ff']
				const colors2 = ['#ffa4cc', '#ff2090']
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: inlineMarkerTestText,
						language: 'astro',
						meta: `title="src/components/GreetingHeadline.astro" mark='= "Hello"' "= \\"Astronaut\\"" del="puny" ins='mighty {name}!'`,
						plugins: [
							pseudoSyntaxHighlighter({
								highlights: [
									// Highlight starts and ends outside of "puny",
									// but ends inside of "mighty {name}!"
									{ text: '{greeting}, punymig', colors: colors1 },
									// Highlight starts inside of "mighty {name}!" and ends inside
									{ text: 'hty {na', colors: colors2 },
								],
								renderPhase: 'latest',
							}),
							pluginTextMarkers(),
						],
						blockValidationFn: ({ renderedGroupAst, theme }) => {
							// Expect that the correct texts were marked
							const validateMarkers = buildMarkerValidationFn([
								{ markerType: 'mark', text: '= "Hello"' },
								{ markerType: 'mark', text: '= "Astronaut"' },
								{ markerType: 'del', text: 'puny' },
								// Expect the "mighty {name}!" highlight to be split into fragments
								// that can be styled separately
								{ markerType: 'ins', text: 'mig', classNames: ['open-end'] },
								{ markerType: 'ins', text: 'hty {na', classNames: ['open-start', 'open-end'] },
								{ markerType: 'ins', text: 'me}!', classNames: ['open-start'] },
							])
							validateMarkers({ renderedGroupAst, theme })

							// Expect that the highlights were not split
							const matchingElements = selectAll(`span[style]`, renderedGroupAst)
							const actualHighlights = matchingElements.map((highlight) => {
								const text = toText(highlight)
								return {
									text,
									color: highlight.properties?.style?.toString().match(/color:(#.*?)(;|$)/)?.[1],
								}
							})
							const typeColorIdx = theme.type === 'dark' ? 0 : 1
							expect(actualHighlights).toMatchObject([
								{ text: '{greeting}, punymig', color: colors1[typeColorIdx] },
								{ text: 'hty {na', color: colors2[typeColorIdx] },
							])
						},
					}),
				})
			})
		})

		describe('Resolves overlapping inline markers', () => {
			const codeSnippet = `
---
import MyReactComponent from '../components/MyReactComponent.jsx';
import MyAstroComponent from '../components/MyAstroComponent.astro';
---

<MyReactComponent>
  <MyAstroComponent slot="name" />
</MyReactComponent>
		`.trim()

			test('Markers of the same type get merged', async ({ meta: { name: testName } }) => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: codeSnippet,
						meta: buildMeta([
							// New range starts inside existing range
							{ text: 'slot=' },
							{ text: 'slot="n' },
							{ text: 'ot="name"' },
							// New range ends inside existing range
							{ markerType: 'ins', text: 'components/MyReactComponent.jsx' },
							{ markerType: 'ins', text: 'components/MyReact' },
							{ markerType: 'ins', text: '../components/MyR' },
						]),
						plugins: [pluginTextMarkers()],
						blockValidationFn: buildMarkerValidationFn([
							{
								markerType: 'ins',
								text: `../components/MyReactComponent.jsx`,
							},
							{
								markerType: 'mark',
								text: `slot="name"`,
							},
						]),
					}),
				})
			})

			test('Deletions override markings', async ({ meta: { name: testName } }) => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: codeSnippet,
						meta: buildMeta([
							{ text: '<MyAstroComponent slot="name" />' },
							// This deletion has a higher priority than the marking before,
							// so it must override it
							{ markerType: 'del', text: 'slot="name"' },
						]),
						plugins: [pluginTextMarkers()],
						blockValidationFn: buildMarkerValidationFn([
							{
								markerType: 'mark',
								text: `<MyAstroComponent `,
							},
							{
								markerType: 'del',
								text: `slot="name"`,
							},
							{
								markerType: 'mark',
								text: ` />`,
							},
						]),
					}),
				})
			})

			test('Insertions override deletions and markings', async ({ meta: { name: testName } }) => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: codeSnippet,
						meta: buildMeta([
							{ text: '<MyAstroComponent slot="name" />' },
							// This deletion has a higher priority than the marking before,
							// so it must override it
							{ markerType: 'del', text: 'slot="name"' },
							// This insertion has a higher priority than the deletion before,
							// so it must override it again
							{ markerType: 'ins', text: 'slot' },
						]),
						plugins: [pluginTextMarkers()],
						blockValidationFn: buildMarkerValidationFn([
							{
								markerType: 'mark',
								text: `<MyAstroComponent `,
							},
							{
								markerType: 'ins',
								text: `slot`,
							},
							{
								markerType: 'del',
								text: `="name"`,
							},
							{
								markerType: 'mark',
								text: ` />`,
							},
						]),
					}),
				})
			})

			test('Lower priority markers cannot override higher ones', async ({ meta: { name: testName } }) => {
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code: codeSnippet,
						meta: buildMeta([
							{ markerType: 'ins', text: '"name"' },
							// This deletion has a lower priority than the insertion,
							// so it must not override it despite the order
							{ markerType: 'del', text: 'slot="name"' },
							// This marking has a lower priority than the deletion,
							// so it must not override it despite the order
							{ text: '<MyAstroComponent slot="name" />' },
						]),
						plugins: [pluginTextMarkers()],
						blockValidationFn: buildMarkerValidationFn([
							{
								markerType: 'mark',
								text: `<MyAstroComponent `,
							},
							{
								markerType: 'del',
								text: `slot=`,
							},
							{
								markerType: 'ins',
								text: `"name"`,
							},
							{
								markerType: 'mark',
								text: ` />`,
							},
						]),
					}),
				})
			})
		})
	})

	describe('Diff language', () => {
		test(`Converts diff syntax to line-level markers`, async ({ meta: { name: testName } }) => {
			const code = jsCodeWithDiffMarkers
			const expectedCode = code
				.split('\n')
				.map((line) => line.replace(/^[-+]/, ''))
				.join('\n')
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code,
					language: 'diff',
					plugins: [pluginTextMarkers()],
					blockValidationFn: buildMarkerValidationFn(
						[
							{ fullLine: true, markerType: 'del', text: '  integrations: [vue(), lit()]' },
							{ fullLine: true, markerType: 'ins', text: '  integrations: [lit(), vue()]' },
						],
						expectedCode
					),
				}),
			})
		})
		test(`Removes common minimum indentation level`, async ({ meta: { name: testName } }) => {
			const code = indentedJsCodeWithDiffMarkers
			const expectedCode = code
				.split('\n')
				.map((line) => line.slice(2))
				.join('\n')
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code,
					language: 'diff',
					plugins: [pluginTextMarkers()],
					blockValidationFn: buildMarkerValidationFn(
						[
							{ fullLine: true, markerType: 'del', text: '  integrations: [vue(), lit()]' },
							{ fullLine: true, markerType: 'ins', text: '  integrations: [lit(), vue()]' },
						],
						expectedCode
					),
				}),
			})
		})
		test(
			`Does not modify actual diff content`,
			async ({ meta: { name: testName } }) => {
				const code = actualDiff
				await renderAndOutputHtmlSnapshot({
					testName,
					testBaseDir: __dirname,
					fixtures: buildThemeFixtures(themes, {
						code,
						language: 'diff',
						plugins: [pluginTextMarkers(), pluginShiki()],
						blockValidationFn: buildMarkerValidationFn([], code),
					}),
				})
			},
			{ timeout: 5 * 1000 }
		)
	})

	test(`Combined line and inline plaintext markers`, async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: inlineMarkerTestText,
				language: 'astro',
				meta: `title="src/components/GreetingHeadline.astro" mark={4} mark='= "Hello"' "= \\"Astronaut\\"" del="puny" ins='mighty'`,
				plugins: [pluginTextMarkers()],
				blockValidationFn: buildMarkerValidationFn([
					{ markerType: 'mark', text: '= "Hello"' },
					{ markerType: 'mark', text: '= "Astronaut"' },
					{ fullLine: true, markerType: 'mark', text: '<h2>{greeting}, punymighty {name}!</h2>' },
					{ markerType: 'del', text: 'puny' },
					{ markerType: 'ins', text: 'mighty' },
				]),
			}),
		})
	})

	test(
		`Actual example with Shiki highlighting`,
		async ({ meta: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: `
---
layout: ../../layouts/BaseLayout.astro
title: 'My first MDX post'
+publishDate: '21 September 2022'
---
import BaseLayout from '../../layouts/BaseLayout.astro';

function fancyJsHelper() {
  return "Try doing that with YAML!";
}

<BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>
  Welcome to my new Astro blog, using MDX!
</BaseLayout>
					`.trim(),
					language: 'diff',
					meta: `lang="mdx" title="src/pages/posts/first-post.mdx" ins={6} mark={9} del={2} /</?BaseLayout>/ /</?BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>/`,
					plugins: [pluginTextMarkers(), pluginShiki()],
					blockValidationFn: buildMarkerValidationFn([
						{ fullLine: true, markerType: 'del', text: `layout: ../../layouts/BaseLayout.astro` },
						{ fullLine: true, markerType: 'ins', text: `publishDate: '21 September 2022'` },
						{ fullLine: true, markerType: 'ins', text: `import BaseLayout from '../../layouts/BaseLayout.astro';` },
						{ fullLine: true, markerType: 'mark', text: `  return "Try doing that with YAML!";` },
						{ markerType: 'mark', text: `<BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>` },
						{ markerType: 'mark', text: `</BaseLayout>` },
					]),
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)
})

function buildMeta(markers: { markerType?: string | undefined; text: string }[]) {
	return markers.map(({ markerType, text }) => `${markerType ? `${markerType}=` : ''}"${text.replace(/(")/g, '\\$1')}"`).join(' ')
}

function buildMarkerValidationFn(
	expectedMarkers: { fullLine?: boolean | undefined; markerType: MarkerType; text: string; classNames?: string[] | undefined }[],
	expectedCode?: string
): NonNullable<TestFixture['blockValidationFn']> {
	return ({ renderedGroupAst }) => {
		const lineMarkerSelectors = MarkerTypeOrder.map((markerType) => `.${markerType}`)
		const inlineMarkerSelectors = MarkerTypeOrder.map((markerType) => `${markerType}`)
		const allMarkersSelector = [...lineMarkerSelectors, ...inlineMarkerSelectors].join(',')
		const matchingElements = selectAll(allMarkersSelector, renderedGroupAst)
		const actualMarkers = matchingElements.map((marker) => {
			let text = toText(marker, { whitespace: 'pre' })
			if (text === '\n') text = ''
			const classNames = marker.properties?.className?.toString().split(' ') || []
			if (MarkerTypeOrder.includes(marker.tagName as MarkerType)) {
				return {
					fullLine: false,
					markerType: marker.tagName,
					text,
					classNames,
				}
			}
			for (const markerType of classNames) {
				if (MarkerTypeOrder.includes(markerType as MarkerType)) {
					return {
						fullLine: true,
						markerType,
						text,
						classNames,
					}
				}
			}

			throw new Error(`Failed to find line marker type for matching element with text "${text}"`)
		})
		const expectedMarkersWithDefaults = expectedMarkers.map((marker) => ({
			fullLine: false,
			...marker,
		}))
		expect(actualMarkers).toMatchObject(expectedMarkersWithDefaults)

		// Expect that the correct code was rendered
		if (expectedCode !== undefined) {
			const matchingElements = selectAll(`div.ec-line`, renderedGroupAst)
			const actualCode = matchingElements
				.map((line) => {
					const text = toText(line, { whitespace: 'pre' })
					return text === '\n' ? '' : text
				})
				.join('\n')
			expect(actualCode).toEqual(expectedCode)
		}
	}
}

function pseudoSyntaxHighlighter(options: { highlights: { text: string; colors: string[] }[]; renderPhase?: AnnotationRenderPhase | undefined }): ExpressiveCodePlugin {
	return {
		name: 'Pseudo Syntax Highlighter',
		hooks: {
			performSyntaxAnalysis: ({ codeBlock, theme }) => {
				codeBlock.getLines().forEach((line) => {
					options.highlights.forEach(({ text, colors: [dark, light] }) => {
						let idx = line.text.indexOf(text, 0)
						while (idx > -1) {
							line.addAnnotation(
								new InlineStyleAnnotation({
									color: theme.type === 'dark' ? dark : light,
									inlineRange: {
										columnStart: idx,
										columnEnd: idx + text.length,
									},
									renderPhase: options.renderPhase || 'normal',
								})
							)
							idx = line.text.indexOf(text, idx + text.length)
						}
					})
				})
			},
		},
	}
}
