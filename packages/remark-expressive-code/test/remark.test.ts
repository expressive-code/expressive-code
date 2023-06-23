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
