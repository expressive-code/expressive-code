import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import {
	ExpressiveCodeBlockProps,
	ExpressiveCodeEngine,
	ExpressiveCodeEngineConfig,
	ExpressiveCodePlugin,
	ExpressiveCodeTheme,
	PartialAllowUndefined,
	StyleVariant,
} from '@expressive-code/core'
import type { Element } from '@expressive-code/core/hast'
import { toHtml } from '@expressive-code/core/hast'

export type BlockValidationFn = ({ renderedGroupAst, baseStyles, styleVariants }: { renderedGroupAst: Element; baseStyles: string; styleVariants: StyleVariant[] }) => void

export type TestFixture = {
	fixtureName: string
	code: string
	language?: string | undefined
	meta?: string | undefined
	props?: PartialAllowUndefined<ExpressiveCodeBlockProps> | undefined
	themes?: ExpressiveCodeTheme[] | undefined
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

async function renderFixture({ fixtureName, code, language = 'js', meta = '', props, themes, plugins, engineOptions, blockValidationFn }: TestFixture) {
	const engine = new ExpressiveCodeEngine({
		themes,
		plugins,
		...engineOptions,
	})
	const baseStyles = await engine.getBaseStyles()
	const themeStyles = await engine.getThemeStyles()
	const jsModules = await engine.getJsModules()
	const { renderedGroupAst, styles } = await engine.render({
		code,
		language,
		meta,
		props,
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
	const documentParts = serializeRenderResultsToDocumentParts({ testName, testBaseDir, renderResults })

	outputHtmlSnapshot({
		testName,
		testBaseDir,
		documentParts,
	})

	renderResults.forEach(({ blockValidationFn, ...rest }) => {
		if (!blockValidationFn) return
		blockValidationFn({ ...rest })
	})
}

export type DocumentParts = {
	head?: string | undefined
	body: string
}

export function outputHtmlSnapshot({ testName, testBaseDir, documentParts }: { testName: string; testBaseDir: string; documentParts: DocumentParts }) {
	const snapshotBasePath = join(testBaseDir, '__html_snapshots__')
	const snapshotFileName = `${testName.replace(/[<>:"/\\|?*.]/g, '').toLowerCase()}.html`
	const snapshotFilePath = join(snapshotBasePath, '__actual__', snapshotFileName)

	// Write the snapshot to an HTML file for easy inspection of failed tests
	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${testName}</title>
  <style>
    body { margin: 0; background: #248; color: #fff; font-family: sans-serif }
    body > header { padding: 0.5rem 1rem; background: hsl(230 40% 20%); border-bottom: 1px solid hsl(230 40% 35%) }
	body > section { padding: 1.25rem 1rem }
    h1 { font-size: 1.5rem; padding: 0 }
    h2 { text-align: center; font-size: 0.8rem; padding: 0; margin: 0 0 1rem 0; opacity: 0.6 }
  </style>
  ${documentParts.head || ''}
</head>
<body>
  <header><h1>Test: ${testName}</h1></header>
  ${documentParts.body}
</body>
</html>
	`

	mkdirSync(dirname(snapshotFilePath), { recursive: true })
	writeFileSync(snapshotFilePath, html, 'utf8')
}

function serializeRenderResultsToDocumentParts({ renderResults }: { testName: string; testBaseDir: string; renderResults: Awaited<ReturnType<typeof renderFixture>>[] }) {
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
			<h2>${heading}</h2>
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

	return {
		head: `<style>${[...baseStyles].join('')}</style>`,
		body: `${[...jsModules].map((moduleCode) => `<script type="module">${moduleCode}</script>`).join('')}
  ${[...renderedBlocks].join('\n')}`,
	}
}

export function showAllThemesInRenderedBlockHtml(html: string) {
	// Find all theme selectors contained in the HTML
	const matches = html.matchAll(/\.expressive-code([^{ ]+?) \.ec-line :where\(span\[style\^='--'\]:not\(\[class\]\)\){color:var\(--/g)
	const selectors = [...matches].map((match) => {
		const selector = match[1]
		if (selector.startsWith('[')) return `class="expressive-code" ${selector.slice(1, -1)}`
		return `class="expressive-code ${selector.replace(/\./g, ' ').trim()}"`
	})
	if (!selectors.length) selectors.push('')
	return selectors
		.map((selector) => {
			const foreground = '#fff'
			const background = '#248'
			return `
		<section style="color:${foreground};background:${background}">
			<h2>${selector.replace(/class="expressive-code" /g, '')}</h2>
			${html.replace(/<h1>Sample code<\/h1>/g, '').replace(/<div ([^>]*?)class="expressive-code"([^>]*?)>/g, `<div $1${selector}$2>`)}
		</section>
			`
		})
		.join('\n')
}
