import { describe, test, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import toHtml from 'rehype-stringify'
import remarkExpressiveCode, { RemarkExpressiveCodeOptions } from '../src'
import { sampleCodeHtmlRegExp, sampleCodeMarkdown } from './utils'

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
				const actualBgColor = html.match(/.ec-\w+? pre{(?:[^}]*?;)*background:(.*?)[;}]/)?.[1]
				const actualTextColor = html.match(/.ec-\w+? pre\s*>\s*code{(?:[^}]*?;)*color:(.*?)[;}]/)?.[1]
				expect(html).toMatch(sampleCodeHtmlRegExp)
				expect(actualBgColor).toMatch(bgColor)
				expect(actualTextColor).toMatch(textColor)
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
