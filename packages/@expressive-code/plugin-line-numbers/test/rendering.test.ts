import { describe, test } from 'vitest'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { pluginFrames } from '@expressive-code/plugin-frames'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, loadTestThemes } from '@internal/test-utils'
import { pluginLineNumbers } from '../src'

export const complexTestCode = `
---
layout: ../../layouts/BaseLayout.astro
title: 'My first MDX post with an extra long title to test word wrapping'
publishDate: '21 September 2022'
---
import BaseLayout from '../../../../we/need/to/go/deeper/tofind/the/layouts/BaseLayout.astro';

export function fancyJsHelper() {
  const language = 'YAML';
  const message = \`Try doing that with \${language}!\`;
  return message.split(' ').join(' 🚀 ');
}

<BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>
  Welcome to my new Astro blog, using MDX!
</BaseLayout>
`.trim()

export const complexTestMeta = `title="src/pages/posts/first-post.mdx" collapse={9-11} ins={"A":6} mark={'B':9-11} del={2} /</?BaseLayout>/ /</?BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>/`

describe('Renders line numbers', async () => {
	const themes = await loadTestThemes()

	test(
		`With all plugins and wrap`,
		async ({ task: { name: testName } }) => {
			await renderAndOutputHtmlSnapshot({
				testName,
				testBaseDir: __dirname,
				fixtures: buildThemeFixtures(themes, {
					code: complexTestCode,
					language: 'mdx',
					meta: complexTestMeta + ' wrap',
					plugins: [pluginShiki(), pluginTextMarkers(), pluginFrames(), pluginCollapsibleSections(), pluginLineNumbers()],
					blockValidationFn: (/*actual*/) => {
						// // Expect that MDX syntax highlighting was applied
						// // due to the `lang="mdx"` meta attribute
						// const matchingElements = selectAll(`span[style]`, actual.renderedGroupAst)
						// const tokenColors = matchingElements.map((highlight) => {
						// 	const text = toText(highlight)
						// 	return {
						// 		text,
						// 		color: highlight.properties?.style?.toString().match(/--0:(#.*?)(;|$)/)?.[1],
						// 	}
						// })
						// const getScopeFg = (scope: string) => {
						// 	for (const setting of themes[0].settings) {
						// 		if (setting.scope?.includes(scope) && setting.settings.foreground) {
						// 			return setting.settings.foreground.toLowerCase()
						// 		}
						// 	}
						// }
						// const getActualTokenFg = (text: string) => tokenColors.find((token) => token.text === text)?.color?.toLowerCase()
						// const colorTests = [
						// 	['title', getScopeFg('entity.name.tag')],
						// 	['My first MDX post', getScopeFg('string')],
						// ] as const
						// colorTests.forEach(([text, expectedColor]) => {
						// 	expect(getActualTokenFg(text), `Frontmatter tag \`${text}\` does not have the expected color`).toEqual(expectedColor)
						// })
					},
				}),
			})
		},
		{ timeout: 5 * 1000 }
	)
})

// function buildMarkerValidationFn(
// 	expectedMarkers: { fullLine?: boolean | undefined; markerType: MarkerType; text: string; classNames?: string[] | undefined; label?: string | undefined }[],
// 	expectedCode?: string
// ): NonNullable<TestFixture['blockValidationFn']> {
// 	return ({ renderedGroupAst }) => {
// 		const lineMarkerSelectors = MarkerTypeOrder.map((markerType) => `.${markerType}`)
// 		const inlineMarkerSelectors = MarkerTypeOrder.map((markerType) => `${markerType}`)
// 		const allMarkersSelector = [...lineMarkerSelectors, ...inlineMarkerSelectors].join(',')
// 		const matchingElements = selectAll(allMarkersSelector, renderedGroupAst)
// 		const actualMarkers = matchingElements.map((marker) => {
// 			let text = toText(select('.code', marker) || marker, { whitespace: 'pre' })
// 			if (text === '\n') text = ''
// 			const label = getInlineStyles(marker).get('--tmLabel')?.replace(/^'|'$/g, '')
// 			const classNames = getClassNames(marker)
// 			if (MarkerTypeOrder.includes(marker.tagName as MarkerType)) {
// 				return {
// 					fullLine: false,
// 					markerType: marker.tagName,
// 					text,
// 					classNames,
// 					label,
// 				}
// 			}
// 			for (const markerType of classNames) {
// 				if (MarkerTypeOrder.includes(markerType as MarkerType)) {
// 					return {
// 						fullLine: true,
// 						markerType,
// 						text,
// 						classNames,
// 						label,
// 					}
// 				}
// 			}

// 			throw new Error(`Failed to find line marker type for matching element with text "${text}"`)
// 		})
// 		const expectedMarkersWithDefaults = expectedMarkers.map((marker) => ({
// 			fullLine: false,
// 			...marker,
// 		}))
// 		expect(actualMarkers).toMatchObject(expectedMarkersWithDefaults)

// 		// Expect that the correct code was rendered
// 		if (expectedCode !== undefined) {
// 			const matchingElements = selectAll(`div.ec-line .code`, renderedGroupAst)
// 			const actualCode = matchingElements
// 				.map((line) => {
// 					const text = toText(line, { whitespace: 'pre' })
// 					return text === '\n' ? '' : text
// 				})
// 				.join('\n')
// 			expect(actualCode).toEqual(expectedCode)
// 		}
// 	}
// }
