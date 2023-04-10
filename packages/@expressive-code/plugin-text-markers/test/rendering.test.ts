import { describe, test, expect } from 'vitest'
import { selectAll } from 'hast-util-select'
import { toText } from 'hast-util-to-text'
import { ExpressiveCodeTheme } from '@expressive-code/core'
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
				meta: `del={5} ins={6-7}`,
				plugins: [textMarkers()],
				blockValidationFn: buildMarkerValidationFn([
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

		describe('Resolves overlapping inline markers', () => {
			const codeSnippet = `
---
import MyReactComponent from '../components/MyReactComponent.jsx';
import MyAstroComponent from '../components/MyAstroComponent.astro';
---

<MyReactComponent>
  <MyAstroComponent slot="name" />
</MyReactComponent>
		`

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

function buildMarkerValidationFn(expectedMarkers: { fullLine?: boolean; markerType: MarkerType; text: string }[]): NonNullable<TestFixture['blockValidationFn']> {
	return ({ renderedGroupAst }) => {
		const lineMarkerSelectors = MarkerTypeOrder.map((markerType) => `.${markerType}`)
		const inlineMarkerSelectors = MarkerTypeOrder.map((markerType) => `${markerType}`)
		const allMarkersSelector = [...lineMarkerSelectors, ...inlineMarkerSelectors].join(',')
		const matchingElements = selectAll(allMarkersSelector, renderedGroupAst)
		const actualMarkers = matchingElements.map((marker) => {
			const text = toText(marker)
			if (MarkerTypeOrder.includes(marker.tagName as MarkerType)) {
				return {
					fullLine: false,
					markerType: marker.tagName,
					text,
				}
			}
			const potentialLineMarkerTypes = marker.properties?.className?.toString().split(' ') || []
			for (const markerType of potentialLineMarkerTypes) {
				if (MarkerTypeOrder.includes(markerType as MarkerType)) {
					return {
						fullLine: true,
						markerType,
						text,
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
