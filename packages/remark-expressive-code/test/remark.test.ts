import { describe, test, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import toHtml from 'rehype-stringify'
import remarkExpressiveCode, { RemarkExpressiveCodeOptions } from '../src'
import { sampleCodeHtmlRegExp, sampleCodeMarkdown } from './utils'

const regexCodeBg = /.ec-\w+? pre{(?:[^}]*?;)*background:(.*?)[;}]/
const regexCodeColor = /.ec-\w+? pre\s*>\s*code{(?:[^}]*?;)*color:(.*?)[;}]/
const regexCodeSelectionBg = /.ec-\w+? pre\s+::selection{(?:[^}]*?;)*background:(.*?)[;}]/
const regexScrollbarThumbColor = /.ec-\w+? pre::-webkit-scrollbar-thumb{(?:[^}]*?;)*background-color:(.*?)[;}]/
const regexScrollbarHoverColor = /.ec-\w+? pre::-webkit-scrollbar-thumb:hover{(?:[^}]*?;)*background-color:(.*?)[;}]/

describe('Usage inside unified/remark', () => {
	test('Works without any options', async () => {
		const processor = createRemarkProcessor()
		const result = await processor.process(sampleCodeMarkdown)
		expect(result.value).toMatch(sampleCodeHtmlRegExp)
	})
	test('Can load themes bundled with Shiki by name', async () => {
		const testCases: {
			theme: RemarkExpressiveCodeOptions['theme']
			bgColor: string
			textColor: string
		}[] = [
			{ theme: 'light-plus', bgColor: '#ffffff', textColor: '#000000' },
			{ theme: 'material-theme', bgColor: '#263238', textColor: '#eeffff' },
		]
		await Promise.all(
			testCases.map(async ({ theme, bgColor, textColor }) => {
				const processor = createRemarkProcessor({ theme })
				const result = await processor.process(sampleCodeMarkdown)
				const html = result.value.toString()
				const actualBgColor = html.match(regexCodeBg)?.[1]
				const actualTextColor = html.match(regexCodeColor)?.[1]
				expect(html).toMatch(sampleCodeHtmlRegExp)
				expect(actualBgColor).toEqual(bgColor)
				expect(actualTextColor).toEqual(textColor)
			})
		)
	})
	test('Allows the theme to customize the scrollbar by default', async () => {
		const testCases: {
			theme: RemarkExpressiveCodeOptions['theme']
			thumbColor: string
			hoverColor: string
		}[] = [
			{ theme: 'light-plus', thumbColor: '#64646466', hoverColor: '#646464b2' },
			{ theme: 'material-theme', thumbColor: '#eeffff20', hoverColor: '#eeffff4b' },
		]
		await Promise.all(
			testCases.map(async ({ theme, thumbColor, hoverColor }) => {
				const processor = createRemarkProcessor({ theme })
				const result = await processor.process(sampleCodeMarkdown)
				const html = result.value.toString()
				const actualThumbColor = html.match(regexScrollbarThumbColor)?.[1]
				const actualHoverColor = html.match(regexScrollbarHoverColor)?.[1]
				expect(html).toMatch(sampleCodeHtmlRegExp)
				expect(actualThumbColor).toEqual(thumbColor)
				expect(actualHoverColor).toEqual(hoverColor)
			})
		)
	})
	test('Does not customize the scrollbar if `useThemedScrollbars` is false', async () => {
		const testCases: {
			theme: RemarkExpressiveCodeOptions['theme']
		}[] = [{ theme: 'light-plus' }, { theme: 'material-theme' }]
		await Promise.all(
			testCases.map(async ({ theme }) => {
				const processor = createRemarkProcessor({ theme, useThemedScrollbars: false })
				const result = await processor.process(sampleCodeMarkdown)
				const html = result.value.toString()
				const actualThumbColor = html.match(regexScrollbarThumbColor)?.[1]
				const actualHoverColor = html.match(regexScrollbarHoverColor)?.[1]
				expect(html).toMatch(sampleCodeHtmlRegExp)
				expect(actualThumbColor).toBeUndefined()
				expect(actualHoverColor).toBeUndefined()
			})
		)
	})
	test('Allows the theme to customize selection colors by default', async () => {
		const testCases: {
			theme: RemarkExpressiveCodeOptions['theme']
			codeSelectionBg: string
		}[] = [
			{ theme: 'light-plus', codeSelectionBg: '#add6ff' },
			{ theme: 'material-theme', codeSelectionBg: '#80cbc420' },
		]
		await Promise.all(
			testCases.map(async ({ theme, codeSelectionBg }) => {
				const processor = createRemarkProcessor({ theme })
				const result = await processor.process(sampleCodeMarkdown)
				const html = result.value.toString()
				const actualBg = html.match(regexCodeSelectionBg)?.[1]
				expect(html).toMatch(sampleCodeHtmlRegExp)
				expect(actualBg).toEqual(codeSelectionBg)
			})
		)
	})
	test('Does not customize selection colors if `useThemedSelectionColors` is false', async () => {
		const testCases: {
			theme: RemarkExpressiveCodeOptions['theme']
		}[] = [{ theme: 'light-plus' }, { theme: 'material-theme' }]
		await Promise.all(
			testCases.map(async ({ theme }) => {
				const processor = createRemarkProcessor({ theme, useThemedSelectionColors: false })
				const result = await processor.process(sampleCodeMarkdown)
				const html = result.value.toString()
				const actualBg = html.match(regexCodeSelectionBg)?.[1]
				expect(html).toMatch(sampleCodeHtmlRegExp)
				expect(actualBg).toBeUndefined()
			})
		)
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
