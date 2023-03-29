import { describe, expect, test } from 'vitest'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { Parent } from 'hast-util-to-html/lib/types'
import { ExpressiveCode } from '@expressive-code/core'
import { matches, select, selectAll } from 'hast-util-select'
import { toHtml } from 'hast-util-to-html'
import { frames } from '../src'

describe('Renders frames around the code', () => {
	test('Single JS block without title', async ({ meta: { name: testName } }) => {
		const ec = new ExpressiveCode({
			plugins: [frames()],
		})
		const { renderedGroupAst, styles } = await ec.render({
			code: `import { defineConfig } from 'example/config'`,
			language: 'js',
			meta: '',
		})

		outputHtmlSnapshot({
			renderedGroupAst,
			styles,
			testName,
		})

		validateBlockAst({
			renderedGroupAst,
			figureSelector: '.frame:not(.has-title):not(.is-terminal)',
			srTitlePresent: false,
		})
	})
	test('Single JS block with title', async ({ meta: { name: testName } }) => {
		const ec = new ExpressiveCode({
			plugins: [frames()],
		})
		const { renderedGroupAst, styles } = await ec.render({
			code: `
// test.config.mjs

import { defineConfig } from 'example/config'
			`.trim(),
			language: 'js',
			meta: '',
		})

		outputHtmlSnapshot({
			renderedGroupAst,
			styles,
			testName,
		})

		validateBlockAst({
			renderedGroupAst,
			figureSelector: '.frame.has-title:not(.is-terminal)',
			title: 'test.config.mjs',
			srTitlePresent: false,
		})
	})
	test('Single terminal block without title', async ({ meta: { name: testName } }) => {
		const ec = new ExpressiveCode({
			plugins: [frames()],
		})
		const { renderedGroupAst, styles } = await ec.render({
			code: 'pnpm i expressive-code',
			language: 'shell',
			meta: '',
		})

		outputHtmlSnapshot({
			renderedGroupAst,
			styles,
			testName,
		})

		validateBlockAst({
			renderedGroupAst,
			figureSelector: '.frame.is-terminal:not(.has-title)',
			srTitlePresent: true,
		})
	})
	test('Single terminal block with title', async ({ meta: { name: testName } }) => {
		const ec = new ExpressiveCode({
			plugins: [frames()],
		})
		const { renderedGroupAst, styles } = await ec.render({
			code: 'pnpm i expressive-code',
			language: 'shell',
			meta: 'title="Installing Expressive Code"',
		})

		outputHtmlSnapshot({
			renderedGroupAst,
			styles,
			testName,
		})

		validateBlockAst({
			renderedGroupAst,
			figureSelector: '.frame.has-title.is-terminal',
			title: 'Installing Expressive Code',
			srTitlePresent: false,
		})
	})
})

function validateBlockAst({
	renderedGroupAst,
	figureSelector,
	title,
	srTitlePresent,
}: {
	renderedGroupAst: Parent
	figureSelector: string
	title?: string
	srTitlePresent: boolean
}) {
	// Expect the AST to only contain a single figure element
	const figures = selectAll('figure', renderedGroupAst)
	expect(figures).toHaveLength(1)

	// Expect our figure wrapper to match the given selector
	expect(matches(figureSelector, figures[0])).toEqual(true)

	// Ensure that there is a header (we always render it for styling)
	expect(selectAll('figure > figcaption.header', renderedGroupAst)).toHaveLength(1)

	// Check visible title
	const titles = selectAll('figure > figcaption.header > span.title', renderedGroupAst)
	expect(titles).toHaveLength(title ? 1 : 0)
	if (title) {
		expect(titles[0].children[0].type === 'text' ? titles[0].children[0].value : '').toEqual(title)
	}

	// Check screen reader-only title
	expect(selectAll('figure > figcaption.header > span.sr-only', renderedGroupAst)).toHaveLength(srTitlePresent ? 1 : 0)

	// Expect the figcaption to be followed by a pre element
	expect(select('figure > figcaption + pre', renderedGroupAst)).toBeTruthy()
}

function outputHtmlSnapshot({ renderedGroupAst, styles, testName }: { renderedGroupAst: Parent; styles: Set<string>; testName: string }) {
	const snapshotBasePath = join(__dirname, '__html_snapshots__')
	const snapshotFileName = `${testName.replace(/[<>:"/\\|?*.]/g, '').toLowerCase()}.html`
	const snapshotFilePath = join(snapshotBasePath, '__actual__', snapshotFileName)

	// Write the snapshot to an HTML file for easy inspection of failed tests
	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${testName}</title>
</head>
<body>
  <style>
    ${[...styles].join('')}
  </style>

  <h2>${testName}</h2>
  ${toHtml(renderedGroupAst)}
</body>
</html>
	`

	mkdirSync(dirname(snapshotFilePath), { recursive: true })
	writeFileSync(snapshotFilePath, html, 'utf8')
}
