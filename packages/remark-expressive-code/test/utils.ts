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
		// The code block should have been wrapped into an Expressive Code div
		'<div class="expressive-code .*?">',
		// A style element should have been added
		// (we expect no newlines in the style element,
		// so we use `.*?` instead of `[\\s\\S]*?`)
		'<style>.*?</style>',
		// Allow 0-n inline script modules
		'(<script type="module">.*?</script>)*',
		// Start of the code block
		'<figure(| .*?)>',
		'<figcaption(| .*?)>.*?test.js.*?</figcaption>',
		// Allow an optional copy button
		'(<div class="copy">.*?</div>)?',
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
