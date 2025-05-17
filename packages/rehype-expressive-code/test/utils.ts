export const sampleCodeMarkdown = `
# Sample code
\`\`\`js ins={2}
// test.js
const a = 1
\`\`\`

# Inline
\`const getStringLength = (str) => str.length;{:js}\`
`

export const sampleCodeMarkdownInlineDisabledCodeContents = ['const getStringLength = \\(str\\) => str.length;{:js}']

export const buildSampleCodeHtmlRegExp = ({ title, codeContents }: { title: string; codeContents: string[] }) =>
	new RegExp(
		[
			// The heading should have been transformed to an h1
			'<h1(?:| .*?)>[^<]*?</h1>',
			// The code block group should have been wrapped into an Expressive Code div
			'<div class="expressive-code(| .*?)">',
			// Expect one style element or link to an external stylesheet
			// and capture it in the "styles" capture group
			'(?<styles><style>[\\s\\S]*?</style>|<link rel="stylesheet" href="[^"]*?/ec\\..*?\\.css"(\\s*/)?>)',
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

export const buildSampleCodeHtmlInlineRegExp = ({
	title,
	codeContents,
	enabled = false,
	inlineCodeContents = sampleCodeMarkdownInlineDisabledCodeContents,
}: {
	title: string
	codeContents: string[]
	enabled?: boolean | undefined
	inlineCodeContents?: string[] | undefined
}) =>
	new RegExp(
		[
			// The heading should have been transformed to an h1
			'<h1(?:| .*?)>[^<]*?</h1>',
			// The code block group should have been wrapped into an Expressive Code div
			'<div class="expressive-code(| .*?)">',
			// Expect one style element or link to an external stylesheet
			// and capture it in the "styles" capture group
			'(?<styles><style>[\\s\\S]*?</style>|<link rel="stylesheet" href="[^"]*?/ec\\..*?\\.css"(\\s*/)?>)',
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
			'<h1(?:| .*?)>[^<]*?</h1>',
			...[
				'<p>',
				...(enabled
					? ['<span class="expressive-code(| .*?)">', '<span(?:| .*?)><code(?:| .*?)>', ...inlineCodeContents, '</code></span>', '</span>']
					: ['<code>', ...inlineCodeContents, '</code>']),
				'</p>',
			],
		].join('\\s*')
	)
