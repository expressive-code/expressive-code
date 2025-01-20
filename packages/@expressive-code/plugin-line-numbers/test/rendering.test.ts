import { describe, expect, test } from 'vitest'
import { getClassNames, getInlineStyles, toText } from '@expressive-code/core/hast'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { pluginFrames } from '@expressive-code/plugin-frames'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, loadTestThemes, selectSingle } from '@internal/test-utils'
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

	test(`With all plugins and wrap`, { timeout: 5 * 1000 }, async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: complexTestCode,
				language: 'mdx',
				meta: complexTestMeta + ' wrap',
				plugins: [pluginShiki(), pluginTextMarkers(), pluginFrames(), pluginCollapsibleSections(), pluginLineNumbers()],
				blockValidationFn: (actual) => {
					// Expect line 2 to have the correct line number
					// and be marked as deleted
					const secondLine = selectSingle(`code > div.ec-line:nth-of-type(2)`, actual.renderedGroupAst)
					expect(toText(selectSingle(`.gutter .ln`, secondLine))).toEqual('2')
					expect(getClassNames(secondLine)).toContain('del')

					// Expect line 6 to have the correct line number,
					// be marked as inserted, and have the label "A"
					const sixthLine = selectSingle(`code > div.ec-line:nth-of-type(6)`, actual.renderedGroupAst)
					expect(toText(selectSingle(`.gutter .ln`, sixthLine))).toEqual('6')
					expect(getClassNames(sixthLine)).toEqual(expect.arrayContaining(['ins', 'tm-label']))
					expect(getInlineStyles(sixthLine).get('--tmLabel')).toEqual("'A'")

					// Expect collapsible section summary to contain empty space
					// for a line number
					const collapsibleSummary = selectSingle(`code > details > summary`, actual.renderedGroupAst)
					expect(toText(selectSingle(`.gutter .ln`, collapsibleSummary))).toEqual('')

					// Expect line number 9 to be inside the collapsible section,
					// be marked, and have the label "B"
					const ninthLine = selectSingle(`code > details > div.ec-line:nth-of-type(1)`, actual.renderedGroupAst)
					expect(toText(selectSingle(`.gutter .ln`, ninthLine))).toEqual('9')
					expect(getClassNames(ninthLine)).toEqual(expect.arrayContaining(['mark', 'tm-label']))
					expect(getInlineStyles(ninthLine).get('--tmLabel')).toEqual("'B'")
				},
			}),
		})
	})
})
