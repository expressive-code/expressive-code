export const sampleCodeMarkdown = `
# Sample code
\`\`\`js ins={2}
// test.js
const a = 1
\`\`\`
`

export const sampleCodeHtmlRegExp = new RegExp(
	[
		// The heading should have been transformed to an h1
		'<h1(| .*?)>Sample code</h1>',
		// Allow 0-n inline script modules
		'(<script type="module">.*?</script>)*',
		// A style element should have been added
		// (we expect no newlines in the style element,
		// so we use `.*?` instead of `[\\s\\S]*?`)
		'<style>.*?</style>',
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
