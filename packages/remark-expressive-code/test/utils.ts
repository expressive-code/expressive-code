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
			'<h1(?:| .*?)>Sample code</h1>',
			// The code block group should have been wrapped into an Expressive Code div
			'<div class="expressive-code(| .*?)">',
			// Expect one style element or link to an external stylesheet
			// and capture it in the "styles" capture group
			'(?<styles><style>[\\s\\S]*?</style>|<link rel="stylesheet" href="/_astro/ec\\..*?\\.css"(\\s*/)?>)',
			// Allow 0-n script modules and capture them in the "scripts" capture group
			'(?<scripts><script type="module"(?: src="/_astro/ec\\..*?\\.js")?>[\\s\\S]*?</script>)*',
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
