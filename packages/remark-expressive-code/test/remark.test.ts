import { describe, test, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import toHtml from 'rehype-stringify'
import dracula from 'shiki/themes/dracula.json'
import remarkExpressiveCode, { ExpressiveCodeTheme, RemarkExpressiveCodeOptions, StyleSettingPath, getCssVarName } from '../src'
import { buildSampleCodeHtmlRegExp, sampleCodeMarkdown } from './utils'

const buildCssVarValuesRegex = (setting: StyleSettingPath) => new RegExp(`${getCssVarName(setting)}:(.*?)[;}]`, 'g')
const regexCodeBg = buildCssVarValuesRegex('codeBackground')
const regexCodeColor = buildCssVarValuesRegex('codeForeground')
const regexCodeSelectionBgVar = buildCssVarValuesRegex('codeSelectionBackground')
const regexScrollbarThumbColorVar = buildCssVarValuesRegex('scrollbarThumbColor')
const regexScrollbarHoverColorVar = buildCssVarValuesRegex('scrollbarThumbHoverColor')
const regexCodeSelectionBg = /.expressive-code pre\s+::selection{(?:[^}]*?;)*background:(.*?)[;}]/g
const regexScrollbarThumbColor = /.expressive-code pre::-webkit-scrollbar-thumb{(?:[^}]*?;)*background-color:(.*?)[;}]/g
const regexScrollbarHoverColor = /.expressive-code pre::-webkit-scrollbar-thumb:hover{(?:[^}]*?;)*background-color:(.*?)[;}]/g
const regexThemeClassNames = /:root\[data-theme='([\w-]+?)'\] .expressive-code[,{]/g

describe('Usage inside unified/remark', () => {
	test('Uses default settings when created without any options', async () => {
		const processor = createRemarkProcessor()
		const result = await processor.process(sampleCodeMarkdown)
		const html = result.value.toString()
		const sampleCodeHtmlRegExp = buildSampleCodeHtmlRegExp({
			title: 'test.js',
			codeContents: [
				// Ensure that the Text Markers plugin works by expecting a highlighted code line
				'<div class="ec-line ins">',
				// Expect Shiki highlighting colors inside
				'.*?--0:#.*?',
				// Expect the code line to be closed
				'</div>',
			],
		})
		expect(html).toMatch(sampleCodeHtmlRegExp)
	})
	test('Provides access to styleOverrides settings contributed by default plugins', () => {
		createRemarkProcessor({
			styleOverrides: {
				frames: {
					editorBackground: 'blue',
				},
			},
		})
	})
	describe('Supported inputs of the `themes` option', () => {
		const draculaBg = dracula.colors?.['editor.background'].toLowerCase()
		const draculaFg = dracula.colors?.['editor.foreground'].toLowerCase()

		test('Bundled Shiki theme names', async () => {
			await runThemeTests({
				testCases: [
					{ themes: ['light-plus'], bgColor: ['#ffffff'], textColor: ['#000000'] },
					{ themes: ['material-theme'], bgColor: ['#263238'], textColor: ['#eeffff'] },
				],
			})
		})
		test('JSON themes imported from NPM packages', async () => {
			await runThemeTests({
				testCases: [
					{
						themes: [dracula],
						bgColor: [draculaBg],
						textColor: [draculaFg],
					},
				],
			})
		})
		test('ExpressiveCodeTheme instances', async () => {
			await runThemeTests({
				testCases: [
					{
						themes: [new ExpressiveCodeTheme(dracula)],
						bgColor: [draculaBg],
						textColor: [draculaFg],
					},
				],
			})
		})
		test('Multiple themes in an array', async () => {
			await runThemeTests({
				testCases: [
					{
						// Provide multiple themes by name
						themes: ['light-plus', 'material-theme'],
						// Expect two matches per code block, each with a different theme
						bgColor: ['#ffffff', '#263238'],
						textColor: ['#000000', '#eeffff'],
					},
					{
						// Mix and match theme names, JSON themes, and ExpressiveCodeTheme instances
						themes: [
							'light-plus',
							dracula,
							new ExpressiveCodeTheme({
								name: 'test',
								colors: {
									'editor.background': '#006000',
									'editor.foreground': '#ffa040',
								},
							}),
						],
						bgColor: ['#ffffff', draculaBg, '#006000'],
						textColor: ['#000000', draculaFg, '#ffa040'],
					},
				],
			})
		})
	})
	test('Adds selectors for alternate themes by default', async () => {
		await runThemeTests({
			testCases: [
				{
					// Provide multiple themes by name
					themes: ['light-plus', 'material-theme'],
					themeDataSelectors: ['material-theme'],
				},
			],
		})
	})
	test('Can use the `customizeTheme` option to change alternate theme data selectors', async () => {
		await runThemeTests({
			testCases: [
				{
					// Provide multiple themes by name
					themes: ['light-plus', 'material-theme'],
					themeDataSelectors: ['dark'],
				},
			],
			config: {
				customizeTheme: (theme) => {
					theme.name = theme.type
				},
			},
		})
	})
	test('Allows the theme to customize the scrollbar by default', async () => {
		await runThemeTests({
			testCases: [
				{ themes: ['light-plus'], thumbColor: ['#64646466'], hoverColor: ['#646464b2'] },
				{ themes: ['material-theme'], thumbColor: ['#eeffff20'], hoverColor: ['#eeffff4b'] },
			],
		})
	})
	test('Does not customize the scrollbar if `useThemedScrollbars` is false', async () => {
		await runThemeTests({
			testCases: [
				{ themes: ['light-plus'], thumbColor: [], hoverColor: [] },
				{ themes: ['material-theme'], thumbColor: [], hoverColor: [] },
			],
			config: { useThemedScrollbars: false },
		})
	})
	test('Does not customize selection colors by default', async () => {
		await runThemeTests({
			testCases: [
				{ themes: ['light-plus'], codeSelectionBg: [] },
				{ themes: ['material-theme'], codeSelectionBg: [] },
			],
		})
	})
	test('Allows themes to customize selection colors if `useThemedSelectionColors` is true', async () => {
		await runThemeTests({
			testCases: [
				{ themes: ['light-plus'], codeSelectionBg: ['#add6ff'] },
				{ themes: ['material-theme'], codeSelectionBg: ['#80cbc420'] },
			],
			config: { useThemedSelectionColors: true },
		})
	})
	test('Adds JS modules provided by plugins before the first code block contents', async () => {
		const processor = createRemarkProcessor({
			frames: {
				// Test that disabling the copy button prevents its JS module from being added
				showCopyToClipboardButton: false,
			},
			plugins: [
				{
					name: 'TestPlugin',
					hooks: {},
					jsModules: ['console.log("Test 1")', '\t\tconsole.log("Test 2") '],
				},
			],
		})
		const result = await processor.process(sampleCodeMarkdown)
		const html = result.value.toString()
		// Expect all JS modules to be part of the output
		const actualJsModules = html.match(/<script type="module">(.*?)<\/script>/g)
		expect(actualJsModules).toEqual([
			'<script type="module">console.log("Test 1")</script>',
			// Expect whitespace to be normalized in Test 2
			'<script type="module">console.log("Test 2")</script>',
		])
		// Expect JS modules to be nested inside the Expressive Code wrapper
		const firstGroupWrapperIndex = html.search(/<div class="expressive-code/)
		const firstJsModuleIndex = html.indexOf('<script type="module">')
		const firstCodeBlockContentsIndex = html.search(/<(figure|code|pre)/)
		expect(firstGroupWrapperIndex, 'Script modules are not located after opening group wrapper').toBeLessThan(firstJsModuleIndex)
		expect(firstJsModuleIndex, 'Script modules are not located before first code block contents').toBeLessThan(firstCodeBlockContentsIndex)
	})
	test('Does not repeat JS modules on subsequent code blocks', async () => {
		const multiBlockMarkdown = `${sampleCodeMarkdown}\n\n${sampleCodeMarkdown}`
		const processor = createRemarkProcessor({
			frames: {
				// Test that disabling the copy button prevents its JS module from being added
				showCopyToClipboardButton: false,
			},
			plugins: [
				{
					name: 'TestPlugin',
					hooks: {},
					jsModules: ['console.log("Test 1")', '\t\tconsole.log("Test 2") '],
				},
			],
		})
		const result = await processor.process(multiBlockMarkdown)
		const html = result.value.toString()
		// Expect all JS modules to be part of the output, but only once each
		const actualJsModules = html.match(/<script type="module">(.*?)<\/script>/g)
		expect(actualJsModules).toEqual([
			'<script type="module">console.log("Test 1")</script>',
			// Expect whitespace to be normalized in Test 2
			'<script type="module">console.log("Test 2")</script>',
		])
		// Expect JS modules to be nested inside the Expressive Code wrapper
		const firstGroupWrapperIndex = html.search(/<div class="expressive-code/)
		const firstJsModuleIndex = html.indexOf('<script type="module">')
		const lastJsModuleIndex = html.lastIndexOf('<script type="module">')
		const firstCodeBlockContentsIndex = html.search(/<(figure|code|pre)/)
		expect(firstGroupWrapperIndex, 'Script modules are not located after opening group wrapper').toBeLessThan(firstJsModuleIndex)
		expect(lastJsModuleIndex, 'Last script module is not located before first code block contents').toBeLessThan(firstCodeBlockContentsIndex)
	})
	test('Does not repeat styles on subsequent code blocks', async () => {
		const multiBlockMarkdown = `${sampleCodeMarkdown}\n\n${sampleCodeMarkdown}`
		const processor = createRemarkProcessor()
		const result = await processor.process(multiBlockMarkdown)
		const html = result.value.toString()
		// Expect styles to be part of the output, but only once
		const actualStyles = html.match(/<style>(.*?)<\/style>/g)
		expect(actualStyles).toEqual([expect.stringContaining(getCssVarName('codeBackground'))])
		// Expect styles to be nested inside the Expressive Code wrapper
		const firstGroupWrapperIndex = html.search(/<div class="expressive-code/)
		const firstStyleIndex = html.indexOf('<style>')
		const lastStyleIndex = html.lastIndexOf('<style>')
		const firstCodeBlockContentsIndex = html.search(/<(figure|code|pre)/)
		expect(firstGroupWrapperIndex, 'Styles are not located after opening group wrapper').toBeLessThan(firstStyleIndex)
		expect(lastStyleIndex, 'Last style is not located before first code block contents').toBeLessThan(firstCodeBlockContentsIndex)
	})
	test('Does not render unexpected newlines', async () => {
		const processor = createRemarkProcessor()
		const result = await processor.process(sampleCodeMarkdown)
		const html = result.value.toString()
		const sampleCodeHtmlRegExp = buildSampleCodeHtmlRegExp({
			title: 'test.js',
			codeContents: [
				// Capture all code contents
				'(?<code>[\\s\\S]*?)',
			],
		})
		const match = html.match(sampleCodeHtmlRegExp)
		expect(match).toBeTruthy()
		const { code, styles } = match?.groups || {}
		expect(code, `Code contained unexpected newlines: ${code}`).not.toContain('\n')
		expect(styles, `Styles contained unexpected newlines: ${styles}`).not.toContain('\n')
	})
	describe('Normalizes tabs in code', () => {
		const codeWithTabs = `\`\`\`js
function test() {
	try {
		console.log('It worked!')
	} catch (e) {
		console.log('How did this happen?')
	}
}
\`\`\``

		test('Replaces tabs with 2 spaces by default', async () => {
			const processor = createRemarkProcessor()
			const result = await processor.process(codeWithTabs)
			const html = result.value.toString()
			const text = getCodePlaintextFromHtml(html)
			expect(text).toContain(`\n  try {\n`)
			expect(text).toContain(`\n    console.log('It worked!')\n`)
		})
		test('Can be configured to use a different tab width', async () => {
			const processor = createRemarkProcessor({ tabWidth: 4 })
			const result = await processor.process(codeWithTabs)
			const html = result.value.toString()
			const text = getCodePlaintextFromHtml(html)
			expect(text).toContain(`\n    try {\n`)
			expect(text).toContain(`\n        console.log('It worked!')\n`)
		})
		test('Can be skipped by setting tabWidth to 0', async () => {
			const processor = createRemarkProcessor({ tabWidth: 0 })
			const result = await processor.process(codeWithTabs)
			const html = result.value.toString()
			const text = getCodePlaintextFromHtml(html)
			expect(text).toContain(`\n\ttry {\n`)
			expect(text).toContain(`\n\t\tconsole.log('It worked!')\n`)
		})
	})
})

async function runThemeTests({
	testCases,
	config,
}: {
	testCases: {
		themes: RemarkExpressiveCodeOptions['themes']
		bgColor?: string[] | undefined
		textColor?: string[] | undefined
		thumbColor?: string[] | undefined
		hoverColor?: string[] | undefined
		codeSelectionBg?: string[] | undefined
		themeDataSelectors?: string[] | undefined
	}[]
	config?: RemarkExpressiveCodeOptions | undefined
}) {
	await Promise.all(
		testCases.map(async (testCase) => {
			const processor = createRemarkProcessor({ themes: testCase.themes, ...config })
			const result = await processor.process(sampleCodeMarkdown)
			const html = result.value.toString()

			// Perform individual tests specified in the test case
			let performedTests = 0
			const performRegexTest = (expected: string[] | undefined, regex: RegExp, regexCssVarUsage?: RegExp) => {
				if (!expected) return
				// If we are testing a CSS variable, test if it was used in the CSS
				if (regexCssVarUsage) {
					const actualUsage = [...html.matchAll(regexCssVarUsage)].map((match) => match[1])
					expect(actualUsage.length, 'CSS variable was not used in styles as expected').toEqual(expected.length)
				}
				// If we expected the variable to be used, also test its value
				if (regexCssVarUsage && expected.length > 0) {
					const actual = [...html.matchAll(regex)].map((match) => match[1])
					expect(actual).toEqual(expected)
				}
				performedTests++
			}
			performRegexTest(testCase.bgColor, regexCodeBg)
			performRegexTest(testCase.textColor, regexCodeColor)
			performRegexTest(testCase.thumbColor, regexScrollbarThumbColorVar, regexScrollbarThumbColor)
			performRegexTest(testCase.hoverColor, regexScrollbarHoverColorVar, regexScrollbarHoverColor)
			performRegexTest(testCase.codeSelectionBg, regexCodeSelectionBgVar, regexCodeSelectionBg)
			performRegexTest(testCase.themeDataSelectors, regexThemeClassNames)
			expect(performedTests).toBeGreaterThan(0)
		})
	)
}

function createRemarkProcessor(options?: RemarkExpressiveCodeOptions) {
	const processor = unified()
		.use(remarkParse)
		// Add our plugin
		.use(remarkExpressiveCode, options)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(toHtml)
		.freeze()
	return processor
}

function getCodePlaintextFromHtml(html: string) {
	const blockHtml = html.match(/<pre(?:|\s[^>]+)><code>(.*?)<\/code><\/pre>/)?.[1] || ''
	return blockHtml.replace(/<span.*?>(.*?)<\/span>/g, '$1').replace(/<div class="ec-line.*?>(.*?)<\/div>/g, '$1\n')
}
