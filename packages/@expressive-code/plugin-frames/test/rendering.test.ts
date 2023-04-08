import { describe, expect, test } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { Parent } from 'hast-util-to-html/lib/types'
import { ExpressiveCode, ExpressiveCodeConfig, ExpressiveCodeTheme } from '@expressive-code/core'
import { matches, select, selectAll } from 'hast-util-select'
import { toHtml } from 'hast-util-to-html'
import { FramesPluginOptions, frames } from '../src'

describe('Renders frames around the code', () => {
	const themeNames = [undefined, 'ayu-green-dark-bordered', 'empty-light', 'shades-of-purple', 'synthwave-color-theme', 'vim-dark-medium']
	const themes = themeNames.map((themeName) => {
		if (!themeName) return undefined
		const themeContents = readFileSync(join(__dirname, 'themes', `${themeName}.json`), 'utf8')
		return ExpressiveCodeTheme.fromJSONString(themeContents)
	})

	test('Single JS block without title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			code: `import { defineConfig } from 'example/config'`,
			testName,
			themes,
			blockValidationFn: ({ renderedGroupAst }) => {
				validateBlockAst({
					renderedGroupAst,
					figureSelector: '.frame:not(.has-title):not(.is-terminal)',
					srTitlePresent: false,
				})
			},
		})
	})
	test('Single JS block with title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			code: `
// test.config.mjs

import { defineConfig } from 'example/config'
			`.trim(),
			testName,
			themes,
			blockValidationFn: ({ renderedGroupAst }) => {
				validateBlockAst({
					renderedGroupAst,
					figureSelector: '.frame.has-title:not(.is-terminal)',
					title: 'test.config.mjs',
					srTitlePresent: false,
				})
			},
		})
	})
	test('Single terminal block without title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			code: 'pnpm i expressive-code',
			language: 'shell',
			testName,
			themes,
			blockValidationFn: ({ renderedGroupAst }) => {
				validateBlockAst({
					renderedGroupAst,
					figureSelector: '.frame.is-terminal:not(.has-title)',
					srTitlePresent: true,
				})
			},
		})
	})
	test('Single terminal block with title', async ({ meta: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			code: 'pnpm i expressive-code',
			language: 'shell',
			meta: 'title="Installing Expressive Code"',
			testName,
			themes,
			blockValidationFn: ({ renderedGroupAst }) => {
				validateBlockAst({
					renderedGroupAst,
					figureSelector: '.frame.has-title.is-terminal',
					title: 'Installing Expressive Code',
					srTitlePresent: false,
				})
			},
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

async function renderAndOutputHtmlSnapshot({
	code,
	language = 'js',
	meta = '',
	testName,
	themes = [undefined],
	blockValidationFn,
	engineOptions,
	framesPluginOptions,
}: {
	code: string
	language?: string
	meta?: string
	testName: string
	themes?: (ExpressiveCodeTheme | undefined)[]
	blockValidationFn?: ({ renderedGroupAst }: { renderedGroupAst: Parent }) => void
	engineOptions?: Partial<ExpressiveCodeConfig>
	framesPluginOptions?: FramesPluginOptions
}) {
	const renderResults = await Promise.all(
		themes.map(async (theme) => {
			const ec = new ExpressiveCode({
				plugins: [frames(framesPluginOptions)],
				theme,
				...engineOptions,
			})
			const baseStyles = await ec.getBaseStyles()
			const { renderedGroupAst, styles } = await ec.render({
				code,
				language,
				meta,
			})

			return {
				renderedGroupAst,
				baseStyles,
				styles,
				theme: ec.theme,
				foreground: ec.theme.type === 'dark' ? '#fff' : '#000',
				background: ec.theme.type === 'dark' ? '#000' : '#fff',
			}
		})
	)

	outputHtmlSnapshot({
		testName,
		renderResults,
	})

	if (blockValidationFn) {
		renderResults.forEach(({ renderedGroupAst }) => {
			blockValidationFn({ renderedGroupAst })
		})
	}
}

function outputHtmlSnapshot({
	testName,
	renderResults,
}: {
	testName: string
	renderResults: {
		renderedGroupAst: Parent
		styles: Set<string>
		baseStyles: string
		theme: ExpressiveCodeTheme
		foreground: string
		background: string
	}[]
}) {
	const snapshotBasePath = join(__dirname, '__html_snapshots__')
	const snapshotFileName = `${testName.replace(/[<>:"/\\|?*.]/g, '').toLowerCase()}.html`
	const snapshotFilePath = join(snapshotBasePath, '__actual__', snapshotFileName)

	const baseStyles = new Set<string>()
	renderResults.forEach((renderResult) => {
		if (renderResult.baseStyles) {
			baseStyles.add(renderResult.baseStyles)
		}
	})

	const renderedBlocks = renderResults.map(({ styles, renderedGroupAst, theme, foreground, background }) => {
		const blockStyles = [...styles].join('')
		return `
	<section style="color:${foreground};background:${background}">
		<h2>Theme: ${theme.name}</h2>
		${blockStyles ? `<style>${blockStyles}</style>\n\t\t` : ''}${toHtml(renderedGroupAst)}
	</section>
		`
	})

	// Write the snapshot to an HTML file for easy inspection of failed tests
	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${testName}</title>
  <style>
    body { margin: 0; background: #000; color: #fff; font-family: sans-serif }
    body > header { padding: 0.5rem 1rem; background: hsl(230 40% 20%); border-bottom: 1px solid hsl(230 40% 35%) }
	body > section { padding: 1.25rem 1rem }
    h1 { font-size: 1.5rem; padding: 0 }
    h2 { text-align: center; font-size: 0.8rem; padding: 0; margin: 0 0 1rem 0; opacity: 0.6 }
  </style>
  <style>${[...baseStyles].join('')}</style>
</head>
<body>
  <header><h1>Test: ${testName}</h1></header>
  ${[...renderedBlocks].join('\n')}
</body>
</html>
	`

	mkdirSync(dirname(snapshotFilePath), { recursive: true })
	writeFileSync(snapshotFilePath, html, 'utf8')
}
