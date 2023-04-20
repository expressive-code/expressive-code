import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { ExpressiveCodeEngine, ExpressiveCodeEngineConfig, ExpressiveCodePlugin, ExpressiveCodeTheme } from '@expressive-code/core'
import { Parent } from 'hast-util-to-html/lib/types'
import { toHtml } from 'hast-util-to-html'

export type TestFixture = {
	fixtureName: string
	code: string
	language?: string
	meta?: string
	theme?: ExpressiveCodeTheme
	plugins: ExpressiveCodePlugin[]
	engineOptions?: Partial<ExpressiveCodeEngineConfig>
	blockValidationFn?: ({ renderedGroupAst, theme }: { renderedGroupAst: Parent; theme: ExpressiveCodeTheme }) => void
}

export function buildThemeFixtures(themes: (ExpressiveCodeTheme | undefined)[], fixtureContents: Omit<TestFixture, 'fixtureName' | 'theme'>) {
	return themes.map(
		(theme): TestFixture => ({
			fixtureName: `Theme: ${theme?.name ?? 'Default'}`,
			theme,
			...fixtureContents,
		})
	)
}

export async function renderAndOutputHtmlSnapshot({ testName, testBaseDir, fixtures }: { testName: string; testBaseDir: string; fixtures: TestFixture[] }) {
	const renderResults = await Promise.all(
		fixtures.map(async ({ code, language = 'js', meta = '', theme, plugins, engineOptions, blockValidationFn }) => {
			const engine = new ExpressiveCodeEngine({
				plugins,
				theme,
				...engineOptions,
			})
			const baseStyles = await engine.getBaseStyles()
			const { renderedGroupAst, styles } = await engine.render({
				code,
				language,
				meta,
			})

			return {
				renderedGroupAst,
				baseStyles,
				styles,
				theme: engine.theme,
				foreground: engine.theme.type === 'dark' ? '#fff' : '#000',
				background: engine.theme.type === 'dark' ? '#000' : '#fff',
				blockValidationFn,
			}
		})
	)

	outputHtmlSnapshot({
		testName,
		testBaseDir,
		renderResults,
	})

	renderResults.forEach(({ renderedGroupAst, theme, blockValidationFn }) => {
		if (!blockValidationFn) return
		blockValidationFn({ renderedGroupAst, theme })
	})
}

export function outputHtmlSnapshot({
	testName,
	testBaseDir,
	renderResults,
}: {
	testName: string
	testBaseDir: string
	renderResults: {
		renderedGroupAst: Parent
		styles: Set<string>
		baseStyles: string
		theme: ExpressiveCodeTheme
		foreground: string
		background: string
	}[]
}) {
	const snapshotBasePath = join(testBaseDir, '__html_snapshots__')
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
