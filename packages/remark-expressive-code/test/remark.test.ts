import { describe, test, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import toHtml from 'rehype-stringify'
import remarkExpressiveCode, { RemarkExpressiveCodeOptions } from '../src'

describe('Usage inside unified/remark', () => {
	test('Works without any options', async () => {
		const processor = createRemarkProcessor()
		const result = await processor.process(`
# Sample code
\`\`\`js ins={2}
// test.js
const a = 1
\`\`\`
		`)
		expect(result.value).toMatch(
			new RegExp(
				[
					// The heading should have been transformed to an h1
					'<h1>Sample code</h1>',
					// The code block should have been transformed to an Expressive Code div
					'<div class="expressive-code .*?">',
					'<figure(| .*?)>',
					'<figcaption(| .*?)>.*?test.js.*?</figcaption>',
					'<pre(| .*?)><code(| .*?)>',
					// Expect the code line to be marked as inserted
					'<div class="ec-line ins">',
					// Expect Shiki highlighting colors inside
					'.*?color:#.*?',
					// Expect all elements to be closed
					'</div>',
					'</code></pre>',
					'</figure>',
					'</div>',
				].join('\\s*')
			)
		)
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
