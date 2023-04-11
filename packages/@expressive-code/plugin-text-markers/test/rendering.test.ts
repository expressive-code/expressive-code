import { describe, test, expect } from 'vitest'
import { selectAll } from 'hast-util-select'
import { toText } from 'hast-util-to-text'
import { h } from 'hastscript'
import { AnnotationRenderOptions, AnnotationRenderPhase, ExpressiveCodePlugin, ExpressiveCodeTheme } from '@expressive-code/core'
import { renderAndOutputHtmlSnapshot, testThemeNames, loadTestTheme, buildThemeFixtures, TestFixture } from '@internal/test-utils'
import { textMarkers } from '../src'
import { MarkerType, MarkerTypeOrder } from '../src/marker-types'

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

describe('Renders text markers', () => {
	const themes: (ExpressiveCodeTheme | undefined)[] = testThemeNames.map(loadTestTheme)
	themes.unshift(undefined)

	test(`Line-level markers`, async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: lineMarkerTestText,
				meta: `del={5} ins={6-7} mark={1,2}`,
				plugins: [textMarkers()],
				blockValidationFn: buildMarkerValidationFn([
					{ fullLine: true, markerType: 'mark', text: `import { defineConfig } from 'astro/config';` },
					{ fullLine: true, markerType: 'mark', text: '' },
					{ fullLine: true, markerType: 'del', text: 'extendDefaultPlugins: false,' },
					{ fullLine: true, markerType: 'ins', text: 'smartypants: false,' },
					{ fullLine: true, markerType: 'ins', text: 'gfm: false,' },
				]),
			}),
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
					plugins: [textMarkers()],
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
					plugins: [textMarkers()],
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
							textMarkers(),
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
							const matchingElements = selectAll(`span.highlight`, renderedGroupAst)
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
								{ text: 'puny', color: colors1[typeColorIdx] },
								{ text: 'mig', color: colors1[typeColorIdx] },
								{ text: 'hty', color: colors2[typeColorIdx] },
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
							textMarkers(),
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
							const matchingElements = selectAll(`span.highlight`, renderedGroupAst)
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
						plugins: [textMarkers()],
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
						plugins: [textMarkers()],
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
						plugins: [textMarkers()],
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
						plugins: [textMarkers()],
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

	test(`Combined line and inline plaintext markers`, async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: inlineMarkerTestText,
				language: 'astro',
				meta: `title="src/components/GreetingHeadline.astro" mark={4} mark='= "Hello"' "= \\"Astronaut\\"" del="puny" ins='mighty'`,
				plugins: [textMarkers()],
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
})

function buildMeta(markers: { markerType?: string; text: string }[]) {
	return markers.map(({ markerType, text }) => `${markerType ? `${markerType}=` : ''}"${text.replace(/(")/g, '\\$1')}"`).join(' ')
}

function buildMarkerValidationFn(
	expectedMarkers: { fullLine?: boolean; markerType: MarkerType; text: string; classNames?: string[] }[]
): NonNullable<TestFixture['blockValidationFn']> {
	return ({ renderedGroupAst }) => {
		const lineMarkerSelectors = MarkerTypeOrder.map((markerType) => `.${markerType}`)
		const inlineMarkerSelectors = MarkerTypeOrder.map((markerType) => `${markerType}`)
		const allMarkersSelector = [...lineMarkerSelectors, ...inlineMarkerSelectors].join(',')
		const matchingElements = selectAll(allMarkersSelector, renderedGroupAst)
		const actualMarkers = matchingElements.map((marker) => {
			const text = toText(marker)
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
	}
}

function pseudoSyntaxHighlighter(options: { highlights: { text: string; colors: string[] }[]; renderPhase?: AnnotationRenderPhase }): ExpressiveCodePlugin {
	return {
		name: 'Pseudo Syntax Highlighter',
		hooks: {
			performSyntaxAnalysis: ({ codeBlock, theme }) => {
				codeBlock.getLines().forEach((line) => {
					options.highlights.forEach(({ text, colors: [dark, light] }) => {
						let idx = line.text.indexOf(text, 0)
						while (idx > -1) {
							line.addAnnotation({
								name: 'highlight',
								inlineRange: {
									columnStart: idx,
									columnEnd: idx + text.length,
								},
								render: ({ nodesToTransform }: AnnotationRenderOptions) => {
									return nodesToTransform.map((node) => h('span.highlight', { style: `color:${theme.type === 'dark' ? dark : light}` }, [node]))
								},
								renderPhase: options.renderPhase || 'normal',
							})
							idx = line.text.indexOf(text, idx + text.length)
						}
					})
				})
			},
		},
	}
}
