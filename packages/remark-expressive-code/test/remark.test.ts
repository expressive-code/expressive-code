import { describe, test, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import toHtml from 'rehype-stringify'
import remarkExpressiveCode, { RemarkExpressiveCodeOptions } from '../src'
import { multiThemeSampleCodeHtmlRegExp, sampleCodeHtmlRegExp, sampleCodeMarkdown } from './utils'

const regexCodeBg = /.ec-\w+? pre{(?:[^}]*?;)*background:(.*?)[;}]/g
const regexCodeColor = /.ec-\w+? pre\s*>\s*code{(?:[^}]*?;)*color:(.*?)[;}]/g
const regexCodeSelectionBg = /.ec-\w+? pre\s+::selection{(?:[^}]*?;)*background:(.*?)[;}]/g
const regexScrollbarThumbColor = /.ec-\w+? pre::-webkit-scrollbar-thumb{(?:[^}]*?;)*background-color:(.*?)[;}]/g
const regexScrollbarHoverColor = /.ec-\w+? pre::-webkit-scrollbar-thumb:hover{(?:[^}]*?;)*background-color:(.*?)[;}]/g
const regexThemeClassNames = /<div class="expressive-code .*?(ec-theme-[\w-]+?)(| .*?)">/g

describe('Usage inside unified/remark', () => {
	test('Works without any options', async () => {
		const processor = createRemarkProcessor()
		const result = await processor.process(sampleCodeMarkdown)
		expect(result.value).toMatch(sampleCodeHtmlRegExp)
	})
	test('Can load themes bundled with Shiki by name', async () => {
		await runThemeTests({
			testCases: [
				{ theme: 'light-plus', bgColor: ['#ffffff'], textColor: ['#000000'] },
				{ theme: 'material-theme', bgColor: ['#263238'], textColor: ['#eeffff'] },
			],
		})
	})
	test('Can load multiple themes', async () => {
		await runThemeTests({
			testCases: [
				{
					// Provide multiple themes by name
					theme: ['light-plus', 'material-theme'],
					// Expect two matches per code block, each with a different theme
					bgColor: ['#ffffff', '#263238'],
					textColor: ['#000000', '#eeffff'],
				},
			],
		})
	})
	test('Adds CSS class names based on the theme names by default', async () => {
		await runThemeTests({
			testCases: [
				{
					// Provide multiple themes by name
					theme: ['light-plus', 'material-theme'],
					themeClassNames: ['ec-theme-light-plus', 'ec-theme-material-theme'],
				},
			],
		})
	})
	test('Can use the `customizeTheme` option to change CSS class names', async () => {
		await runThemeTests({
			testCases: [
				{
					// Provide multiple themes by name
					theme: ['light-plus', 'material-theme'],
					themeClassNames: ['ec-theme-light', 'ec-theme-dark'],
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
				{ theme: 'light-plus', thumbColor: ['#64646466'], hoverColor: ['#646464b2'] },
				{ theme: 'material-theme', thumbColor: ['#eeffff20'], hoverColor: ['#eeffff4b'] },
			],
		})
	})
	test('Does not customize the scrollbar if `useThemedScrollbars` is false', async () => {
		await runThemeTests({
			testCases: [
				{ theme: 'light-plus', thumbColor: [], hoverColor: [] },
				{ theme: 'material-theme', thumbColor: [], hoverColor: [] },
			],
			config: { useThemedScrollbars: false },
		})
	})
	test('Allows the theme to customize selection colors by default', async () => {
		await runThemeTests({
			testCases: [
				{ theme: 'light-plus', codeSelectionBg: ['#add6ff'] },
				{ theme: 'material-theme', codeSelectionBg: ['#80cbc420'] },
			],
		})
	})
	test('Does not customize selection colors if `useThemedSelectionColors` is false', async () => {
		await runThemeTests({
			testCases: [
				{ theme: 'light-plus', codeSelectionBg: [] },
				{ theme: 'material-theme', codeSelectionBg: [] },
			],
			config: { useThemedSelectionColors: false },
		})
	})
	test('Adds JS modules provided by plugins before the first code block', async () => {
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
		const actualJsModules = html.match(/<script type="module">(.*?)<\/script>/g)
		expect(html).toMatch(sampleCodeHtmlRegExp)
		expect(actualJsModules).toEqual([
			'<script type="module">console.log("Test 1")</script>',
			// Expect whitespace to be normalized in Test 2
			'<script type="module">console.log("Test 2")</script>',
		])
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
		theme: RemarkExpressiveCodeOptions['theme']
		bgColor?: string[] | undefined
		textColor?: string[] | undefined
		thumbColor?: string[] | undefined
		hoverColor?: string[] | undefined
		codeSelectionBg?: string[] | undefined
		themeClassNames?: string[] | undefined
	}[]
	config?: RemarkExpressiveCodeOptions | undefined
}) {
	await Promise.all(
		testCases.map(async (testCase) => {
			const processor = createRemarkProcessor({ theme: testCase.theme, ...config })
			const result = await processor.process(sampleCodeMarkdown)
			const html = result.value.toString()
			if (Array.isArray(testCase.theme) && testCase.theme.length > 1) {
				expect(html).toMatch(multiThemeSampleCodeHtmlRegExp)
			} else {
				expect(html).toMatch(sampleCodeHtmlRegExp)
			}

			// Perform individual tests specified in the test case
			let performedTests = 0
			const performRegexTest = (expected: string[] | undefined, regex: RegExp) => {
				if (!expected) return
				const actual = [...html.matchAll(regex)].map((match) => match[1])
				expect(actual).toEqual(expected)
				performedTests++
			}
			performRegexTest(testCase.bgColor, regexCodeBg)
			performRegexTest(testCase.textColor, regexCodeColor)
			performRegexTest(testCase.thumbColor, regexScrollbarThumbColor)
			performRegexTest(testCase.hoverColor, regexScrollbarHoverColor)
			performRegexTest(testCase.codeSelectionBg, regexCodeSelectionBg)
			performRegexTest(testCase.themeClassNames, regexThemeClassNames)
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
	const blockHtml = html.match(/<pre><code>(.*?)<\/code><\/pre>/)?.[1] || ''
	return blockHtml.replace(/<span.*?>(.*?)<\/span>/g, '$1').replace(/<div class="ec-line.*?>(.*?)<\/div>/g, '$1\n')
}
