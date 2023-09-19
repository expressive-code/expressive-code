import { multiThemeWrapperClass } from '../src'

export const sampleCodeMarkdown = `
# Sample code
\`\`\`js ins={2}
// test.js
const a = 1
\`\`\`
`

export const buildSampleCodeHtmlRegExp = ({ title, codeContents, expectMultiThemeWrapper }: { title: string; codeContents: string[]; expectMultiThemeWrapper: boolean }) =>
	new RegExp(
		[
			// The heading should have been transformed to an h1
			'<h1(| .*?)>Sample code</h1>',
			// If multiple themes were rendered, expect a multi-theme wrapper around the groups
			// and start a non-capturing group that allows multiple groups inside
			expectMultiThemeWrapper ? `<div class="${multiThemeWrapperClass}">(?:` : '',
			// The code block group should have been wrapped into an Expressive Code div
			'<div class="expressive-code .*?">',
			// A style element should have been added
			// (we expect no newlines in the style element,
			// so we use `.*?` instead of `[\\s\\S]*?`)
			'<style>.*?</style>',
			// Allow 0-n inline script modules
			'(<script type="module">.*?</script>)*',
			// Start of the code block
			'<figure(| .*?)>',
			'<figcaption(| .*?)>.*?' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*?</figcaption>',
			'<pre(| .*?)><code(| .*?)>',
			...codeContents,
			'</code></pre>',
			// Allow an optional copy button
			'(<div class="copy">.*?</div>)?',
			'</figure>',
			'</div>',
			// If multiple themes were rendered, close the non-capturing group
			// and expect the multi-theme wrapper to end
			expectMultiThemeWrapper ? ')+</div>' : '',
		].join('\\s*')
	)

export const sampleCodeHtmlRegExp = buildSampleCodeHtmlRegExp({
	title: 'test.js',
	codeContents: [
		// Expect a single code line that is marked as inserted
		'<div class="ec-line ins">',
		// Expect Shiki highlighting colors inside
		'.*?color:#.*?',
		// Expect all elements to be closed
		'</div>',
	],
	expectMultiThemeWrapper: false,
})

export const multiThemeSampleCodeHtmlRegExp = buildSampleCodeHtmlRegExp({
	title: 'test.js',
	codeContents: [
		// Expect a single code line that is marked as inserted
		'<div class="ec-line ins">',
		// Expect Shiki highlighting colors inside
		'.*?color:#.*?',
		// Expect all elements to be closed
		'</div>',
	],
	expectMultiThemeWrapper: true,
})
