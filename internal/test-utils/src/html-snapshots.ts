import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { ExpressiveCodeEngine, ExpressiveCodeEngineConfig, ExpressiveCodePlugin, ExpressiveCodeTheme, StyleVariant } from '@expressive-code/core'
import { Parent } from 'hast-util-to-html/lib/types'
import { toHtml } from 'hast-util-to-html'

export type BlockValidationFn = ({ renderedGroupAst, baseStyles, styleVariants }: { renderedGroupAst: Parent; baseStyles: string; styleVariants: StyleVariant[] }) => void

export type TestFixture = {
	fixtureName: string
	code: string
	language?: string | undefined
	meta?: string | undefined
	themes?: ExpressiveCodeTheme | ExpressiveCodeTheme[] | undefined
	plugins: ExpressiveCodePlugin[]
	engineOptions?: Partial<ExpressiveCodeEngineConfig> | undefined
	blockValidationFn?: BlockValidationFn | undefined
}

export function buildThemeFixtures(themes: ExpressiveCodeTheme[], fixtureContents: Omit<TestFixture, 'themes' | 'fixtureName'>) {
	const fixture: TestFixture = {
		fixtureName: '',
		themes,
		...fixtureContents,
	}
	return [fixture]
}

async function renderFixture({ fixtureName, code, language = 'js', meta = '', themes, plugins, engineOptions, blockValidationFn }: TestFixture) {
	const engine = new ExpressiveCodeEngine({
		themes,
		plugins,
		...engineOptions,
	})
	const baseStyles = await engine.getBaseStyles()
	const themeStyles = engine.getThemeStyles()
	const jsModules = await engine.getJsModules()
	const { renderedGroupAst, styles } = await engine.render({
		code,
		language,
		meta,
	})

	return {
		fixtureName,
		renderedGroupAst,
		baseStyles,
		themeStyles,
		jsModules,
		styleVariants: engine.styleVariants,
		styles,
		styleOverrides: engine.styleOverrides,
		blockValidationFn,
	}
}

export async function renderAndOutputHtmlSnapshot({ testName, testBaseDir, fixtures }: { testName: string; testBaseDir: string; fixtures: TestFixture[] }) {
	const renderResults = await Promise.all(fixtures.map(renderFixture))

	outputHtmlSnapshot({
		testName,
		testBaseDir,
		renderResults,
	})

	renderResults.forEach(({ blockValidationFn, ...rest }) => {
		if (!blockValidationFn) return
		blockValidationFn({ ...rest })
	})
}

function outputHtmlSnapshot({ testName, testBaseDir, renderResults }: { testName: string; testBaseDir: string; renderResults: Awaited<ReturnType<typeof renderFixture>>[] }) {
	const snapshotBasePath = join(testBaseDir, '__html_snapshots__')
	const snapshotFileName = `${testName.replace(/[<>:"/\\|?*.]/g, '').toLowerCase()}.html`
	const snapshotFilePath = join(snapshotBasePath, '__actual__', snapshotFileName)

	const baseStyles = new Set<string>()
	const themeStyles = new Set<string>()
	const jsModules = new Set<string>()
	renderResults.forEach((renderResult) => {
		baseStyles.add(renderResult.baseStyles)
		themeStyles.add(renderResult.themeStyles)
		renderResult.jsModules.forEach((jsModule) => {
			jsModules.add(jsModule)
		})
	})

	// Output all fixtures to HTML
	const renderedBlocks = renderResults.map(({ fixtureName, themeStyles, styleVariants, styles, renderedGroupAst }) => {
		// Render the group AST to HTML
		const groupHtml = toHtml(renderedGroupAst)
		// Repeat the group HTML for each style variant, adding the theme name as a data attribute
		// to each wrapper
		const variantGroupHtml = styleVariants.map(({ theme }, index) => {
			const foreground = theme.type === 'dark' ? '#fff' : '#000'
			const background = theme.type === 'dark' ? '#248' : '#eee'
			const heading = fixtureName || `Theme: ${theme?.name ?? 'Missing "name"'}`
			return `
		<section style="color:${foreground};background:${background}">
			<h2>${heading}</h3>
			${groupHtml.replace(/<div (.*?)>/, `<div data-theme="${theme?.name ?? index}" $1>`)}
		</section>
			`
		})
		// Wrap everything into a fixture section
		const blockStyles = [...styles].join('')
		return `
		<style>${themeStyles}${blockStyles || ''}</style>
		${variantGroupHtml.join('')}
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
  ${[...jsModules].map((moduleCode) => `<script type="module">${moduleCode}</script>`).join('')}
  ${[...renderedBlocks].join('\n')}
</body>
</html>
	`

	mkdirSync(dirname(snapshotFilePath), { recursive: true })
	writeFileSync(snapshotFilePath, html, 'utf8')
}
