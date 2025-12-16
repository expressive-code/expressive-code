import { selectAll, toHtml } from '@expressive-code/core/hast'
import { fromHtml } from 'hast-util-from-html'

export const sampleCodeMarkdown = `
# Sample code
\`\`\`js ins={2}
// test.js
const a = 1
\`\`\`
`

export const buildSampleCodeHtmlRegExp = ({ title, codeContents }: { title: string; codeContents: string[] }) =>
	new RegExp(
		[
			// The heading should have been transformed to an h1
			'<h1(?:| .*?)>[^<]*?</h1>',
			// The code block group should have been wrapped into an Expressive Code div
			'<div class="expressive-code(| .*?)">',
			// Expect 1-n style elements or links to an external stylesheet
			// and capture them in the "styles" capture group
			'(?<styles><style>[\\s\\S]*?</style>|<link rel="stylesheet" href="[^"]*?/ec\\..*?\\.css"(\\s*/)?>)+',
			// Allow 0-n script modules and capture them in the "scripts" capture group
			'(?<scripts><script type="module"(?: src="[^"]*?/ec\\..*?\\.js")?>[\\s\\S]*?</script>)*',
			// Start of the code block
			'<figure(?:| .*?)>',
			'<figcaption(?:| .*?)>.*?' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*?</figcaption>',
			'<pre(?:| .*?)><code(?:| .*?)>',
			...codeContents,
			'</code></pre>',
			// Allow an optional copy button
			'(?<copyButton><div class="copy">.*?</div>)?',
			'</figure>',
			'</div>',
		].join('\\s*')
	)

export function extractCodeBlocks(html: string) {
	const hast = fromHtml(html, { fragment: true })
	return selectAll('.expressive-code', hast).map((token) => toHtml(token))
}

export function extractTopLevelAssetsFromBlock(blockHtml: string) {
	const blockHast = fromHtml(blockHtml, { fragment: true })
	const assets = selectAll('.expressive-code > *:not(figure)', blockHast).map((token) => toHtml(token))
	return assets
}

export function escapeRegExp(input: string) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
