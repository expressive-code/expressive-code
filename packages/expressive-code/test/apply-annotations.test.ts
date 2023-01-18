import { describe, expect, test } from 'vitest'
import { applyAnnotations } from '../src/index'
import { createMarkerRegExp, DomUtilsElement, getAnnotationResult, getClassicShikiHighlightedCode, getShikiTwoslashHighlightedCode, ParsedContent } from './utils'

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const codeSnippet = `
---
import MyReactComponent from '../components/MyReactComponent.jsx';
import MyAstroComponent from '../components/MyAstroComponent.astro';
---

<MyReactComponent>
	<MyAstroComponent slot="name" />
</MyReactComponent>
`

describe('Does not fail if there is nothing to do', () => {
	test('Code snippet is empty', () => {
		const annotationResult = getAnnotationResult('')

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([])
	})

	test('lineMarkings is undefined', () => {
		const annotationResult = getAnnotationResult(codeSnippet)

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([])
	})

	test('lineMarkings is empty', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [],
			},
		})

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([])
	})

	test('lineMarkings contains an empty lines array', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [] }],
			},
		})

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([])
	})

	test('lineMarkings only contains non-existing lines', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [-1, 42] }],
			},
		})

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([])
	})
})

describe('Throws a helpful error on unexpected input', () => {
	test('Invalid types passed as HTML input', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const tests: any[] = [undefined, 42, true, NaN, Buffer.from('hello world')]

		tests.forEach((test, idx) => {
			expect(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				() => applyAnnotations(test, { lang: 'js' }),
				`Did not throw expected error for test at index ${idx}, HTML input:\n${JSON.stringify(test)}`
			).toThrowError('code block HTML did not match expected format')
		})
	})

	test('Invalid HTML input at block level', () => {
		const tests = [
			// Empty string
			'',
			// Non-HTML input
			'hello',
			// Code block with missing <pre> wrapper
			`<code>var hi = 'ho'</code>`,
		]

		tests.forEach((test, idx) => {
			expect(
				// This should fail
				() => applyAnnotations(test, { lang: 'js' }),
				`Did not throw expected error for test at index ${idx}, HTML input:\n${test}`
			).toThrowError('code block HTML did not match expected format')
		})
	})

	/*
		- TODO: Detect unexpected text between shiki tokens:
			[
				`<pre class="shiki" style="background-color: #2e3440ff; color: #d8dee9ff"><div class="language-id">astro</div><div class='code-container'><code>`,
				`<div class='line'><span style="color: #616E88">---</span></div>`,
				`<div class='line'><span style="color: #81A1C1">import</span><span style="color: #D8DEE9FF"> </span><span style="color: #D8DEE9">MyAstroComponent</span><span style="color: #D8DEE9FF"> </span><span style="color: #81A1C1">from</span><span style="color: #D8DEE9FF"> </span><span style="color: #ECEFF4">'</span><span style="color: #A3BE8C">../components/MyAstroComponent.astro</span><span style="color: #ECEFF4">'</span><span style="color: #81A1C1">;</span></div>`,
				// This line contains an error here:                      ___________________
				`<div class='line'><span style="color: #616E88">---</span>NOT WRAPPED IN SPAN</div>`,
				`<div class='line'></div>`,
				`<div class='line'><span style="color: #81A1C1">&lt;</span><span style="color: #8FBCBB">MyAstroComponent</span><span style="color: #D8DEE9FF"> </span><span style="color: #8FBCBB">slot</span><span style="color: #ECEFF4">=</span><span style="color: #ECEFF4">"</span><span style="color: #A3BE8C">name</span><span style="color: #ECEFF4">"</span><span style="color: #D8DEE9FF"> </span><span style="color: #81A1C1">/&gt;</span></div>`,
				`</code></div></pre>`,
			].join(''),
	*/

	test('Invalid HTML input at line level', () => {
		const tests = [
			// Non-highlighted code
			`<pre><code>var hi = 'ho'</code></pre>`,
			// Shiki-highlighted code containing errors
			[
				`<pre class="shiki" style="background-color: #2e3440ff"><code>`,
				`<span class="line"><span style="color: #616E88">---</span></span>\n`,
				// This line contains the error - empty lines are not allowed:
				`\n`,
				`<span class="line"><span style="color: #616E88">---</span></span>`,
				`</code></pre>`,
			].join(''),
			[
				`<pre class="shiki" style="background-color: #2e3440ff"><code>`,
				`<span class="line"></span>\n`,
				// This line contains the error - line breaks are not allowed inside tokens:
				`<span class="line"><span style="color: #616E88">---\n---</span></span>`,
				`</code></pre>`,
			].join(''),
			// Shiki Twoslash-highlighted code containing errors
			[
				`<pre class="shiki" style="background-color: #2e3440ff; color: #d8dee9ff"><div class="language-id">astro</div><div class='code-container'><code>`,
				`<div class='line'></div>`,
				// This line contains the error - line breaks are not allowed inside tokens:
				`<div class='line'><span style="color: #616E88">---\n---</span></div>`,
				`</code></div></pre>`,
			].join(''),
		]

		tests.forEach((test, idx) => {
			expect(
				// This should fail
				() => applyAnnotations(test, { lang: 'astro' }),
				`Did not throw expected error for test at index ${idx}, HTML input:\n${test}`
			).toThrowError('code line HTML did not match expected format')
		})
	})
})

describe('Processes line markings correctly', () => {
	test('Undefined (defaults to "mark")', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ lines: [3] }],
			},
		})

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([
			{
				markerType: 'mark',
				text: `import MyAstroComponent from '../components/MyAstroComponent.astro';`,
			},
		])
	})

	describe('Markings ("mark")', () => {
		test('Single line', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					lineMarkings: [{ markerType: 'mark', lines: [3] }],
				},
			})

			expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `import MyAstroComponent from '../components/MyAstroComponent.astro';`,
				},
			])
		})

		test('Multiple lines', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					lineMarkings: [{ markerType: 'mark', lines: [3, 7] }],
				},
			})

			expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `import MyAstroComponent from '../components/MyAstroComponent.astro';`,
				},
				{
					markerType: 'mark',
					text: expect.stringContaining(`<MyAstroComponent slot="name" />`),
				},
			])
		})
	})

	test('Insertions ("ins")', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'ins', lines: [2, 3] }],
			},
		})

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([
			{
				markerType: 'ins',
				text: `import MyReactComponent from '../components/MyReactComponent.jsx';`,
			},
			{
				markerType: 'ins',
				text: `import MyAstroComponent from '../components/MyAstroComponent.astro';`,
			},
		])
	})

	test('Deletions ("del")', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'del', lines: [1, 2, 3, 4] }],
			},
		})

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([
			{
				markerType: 'del',
				text: `---`,
			},
			{
				markerType: 'del',
				text: `import MyReactComponent from '../components/MyReactComponent.jsx';`,
			},
			{
				markerType: 'del',
				text: `import MyAstroComponent from '../components/MyAstroComponent.astro';`,
			},
			{
				markerType: 'del',
				text: `---`,
			},
		])
	})

	test('Ensures empty lines can be highlighted', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'ins', lines: [5] }],
			},
		})
		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([
			{
				markerType: 'ins',
				text: ``,
			},
		])

		// Require the empty line to contain a `span` with `class="empty"`
		const el = annotationResult.annotatedCode.lineMarkings[0].getEl()
		expect(el.children).toMatchObject<Partial<DomUtilsElement>[]>([
			{
				name: 'span',
				attribs: { class: 'empty' },
			},
		])
	})
})

describe('Processes inline markings correctly', () => {
	describe('Throws on invalid marking definitions', () => {
		test('Invalid markerType', () => {
			expect(() =>
				getAnnotationResult(codeSnippet, {
					annotations: {
						// @ts-expect-error We pass an invalid markerType for testing purposes
						inlineMarkings: [{ markerType: 'hurz', text: 'slot="name"' }],
					},
				})
			).toThrowError('valid or undefined markerType')
		})

		test('Missing query property', () => {
			expect(() =>
				getAnnotationResult(codeSnippet, {
					annotations: {
						inlineMarkings: [{ markerType: 'mark' }],
					},
				})
			).toThrowError('valid query property')
		})
	})

	describe('Plaintext inline markings', () => {
		test('Undefined (defaults to "mark")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [{ text: 'slot="name"' }],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `slot="name"`,
				},
			])
		})

		test('Markings ("mark")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: 'slot="name"' }],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `slot="name"`,
				},
			])
		})

		test('Insertions ("ins")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [
						{ markerType: 'ins', text: '<MyReactComponent>' },
						{ markerType: 'ins', text: '</MyReactComponent>' },
					],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'ins',
					text: `<MyReactComponent>`,
				},
				{
					markerType: 'ins',
					text: `</MyReactComponent>`,
				},
			])
		})

		test('Deletions ("del")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [{ markerType: 'del', text: '<MyAstroComponent slot="name" />' }],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'del',
					text: `<MyAstroComponent slot="name" />`,
				},
			])
		})
	})

	describe('RegExp inline markings', () => {
		test('Undefined (defaults to "mark")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [{ regExp: createMarkerRegExp('slot=".*?"') }],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `slot="name"`,
				},
			])
		})

		test('Markings ("mark")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [{ markerType: 'mark', regExp: createMarkerRegExp('slot=".*?"') }],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `slot="name"`,
				},
			])
		})

		test('Insertions ("ins")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [{ markerType: 'ins', regExp: createMarkerRegExp('</?MyReactComponent>') }],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'ins',
					text: `<MyReactComponent>`,
				},
				{
					markerType: 'ins',
					text: `</MyReactComponent>`,
				},
			])
		})

		test('Deletions ("del")', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [{ markerType: 'del', regExp: createMarkerRegExp('<MyAstroComponent.*?/>') }],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'del',
					text: `<MyAstroComponent slot="name" />`,
				},
			])
		})

		describe('Capture group support', () => {
			test('Marks only group contents if capture groups are used', () => {
				const annotationResult = getAnnotationResult(codeSnippet, {
					annotations: {
						inlineMarkings: [{ markerType: 'mark', regExp: createMarkerRegExp('slot="(.*?)"') }],
					},
				})

				expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
					{
						markerType: 'mark',
						text: `name`,
					},
				])
			})

			test('Marks entire match if all group contents are empty', () => {
				const annotationResult = getAnnotationResult(codeSnippet, {
					annotations: {
						inlineMarkings: [{ markerType: 'mark', regExp: new RegExp('(^|hello)import MyReact', 'g') }],
					},
				})

				expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
					{
						markerType: 'mark',
						text: `import MyReact`,
					},
				])
			})

			test('Uses fallback when there is no group index support', () => {
				const annotationResult = getAnnotationResult(codeSnippet, {
					annotations: {
						inlineMarkings: [{ markerType: 'mark', regExp: new RegExp('slot="(.*?)"', 'g') }],
					},
				})

				expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
					{
						markerType: 'mark',
						text: `name`,
					},
				])
			})
		})
	})

	describe('Resolves overlapping inline markings', () => {
		test('Markings of the same type get merged', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [
						// New range starts inside existing range
						{ text: 'slot=' },
						{ text: 'slot="n' },
						{ text: 'ot="name"' },
						// New range ends inside existing range
						{ markerType: 'ins', text: 'components/MyReactComponent.jsx' },
						{ markerType: 'ins', text: 'components/MyReact' },
						{ markerType: 'ins', text: '../components/MyR' },
					],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'ins',
					text: `../components/MyReactComponent.jsx`,
				},
				{
					markerType: 'mark',
					text: `slot="name"`,
				},
			])
		})

		test('Deletions override markings', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [
						{ regExp: createMarkerRegExp('<MyAstroComponent.*?/>') },
						// This deletion has a higher priority than the marking before,
						// so it must override it
						{ markerType: 'del', text: 'slot="name"' },
					],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `<MyAstroComponent `,
				},
				{
					markerType: 'del',
					text: `slot="name"`,
				},
				{
					markerType: 'mark',
					text: ` />`,
				},
			])
		})

		test('Insertions override deletions and markings', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [
						{ regExp: createMarkerRegExp('<MyAstroComponent.*?/>') },
						// This deletion has a higher priority than the marking before,
						// so it must override it
						{ markerType: 'del', text: 'slot="name"' },
						// This insertion has a higher priority than the deletion before,
						// so it must override it again
						{ markerType: 'ins', text: 'slot' },
					],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `<MyAstroComponent `,
				},
				{
					markerType: 'ins',
					text: `slot`,
				},
				{
					markerType: 'del',
					text: `="name"`,
				},
				{
					markerType: 'mark',
					text: ` />`,
				},
			])
		})

		test('Lower priority marking types cannot override higher ones', () => {
			const annotationResult = getAnnotationResult(codeSnippet, {
				annotations: {
					inlineMarkings: [
						{ markerType: 'ins', text: '"name"' },
						// This deletion has a lower priority than the insertion,
						// so it must not override it despite the order
						{ markerType: 'del', text: 'slot="name"' },
						// This marking has a lower priority than the deletion,
						// so it must not override it despite the order
						{ regExp: createMarkerRegExp('<MyAstroComponent.*?/>') },
					],
				},
			})

			expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
				{
					markerType: 'mark',
					text: `<MyAstroComponent `,
				},
				{
					markerType: 'del',
					text: `slot=`,
				},
				{
					markerType: 'ins',
					text: `"name"`,
				},
				{
					markerType: 'mark',
					text: ` />`,
				},
			])
		})
	})
})

describe('Can process HTML code coming from all supported highlighters', () => {
	const runSharedAnnotationTest = (preHighlightedCodeHtml: string) => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'ins', lines: [6, 7, 8] }],
				inlineMarkings: [{ text: 'slot="name"' }],
			},
			preHighlightedCodeHtml,
		})

		expect(annotationResult.annotatedCode.lineMarkings).toMatchObject<ParsedContent[]>([
			{
				markerType: 'ins',
				text: `<MyReactComponent>`,
			},
			{
				markerType: 'ins',
				text: expect.stringContaining(`<MyAstroComponent slot="name" />`),
			},
			{
				markerType: 'ins',
				text: `</MyReactComponent>`,
			},
		])

		expect(annotationResult.annotatedCode.inlineMarkings).toMatchObject<ParsedContent[]>([
			{
				markerType: 'mark',
				text: `slot="name"`,
			},
		])
	}

	test('Classic Shiki', () => {
		const preHighlightedCodeHtml = getClassicShikiHighlightedCode(codeSnippet, 'astro')
		expect(preHighlightedCodeHtml).toContain('<pre class="shiki"')
		expect(preHighlightedCodeHtml, 'Expected classic Shiki output to use line spans separated by newlines').toContain('>\n<span class="line">')
		runSharedAnnotationTest(preHighlightedCodeHtml)
	})

	test('Shiki-Twoslash with non-TS input', () => {
		const preHighlightedCodeHtml = getShikiTwoslashHighlightedCode(codeSnippet, 'astro')
		expect(preHighlightedCodeHtml).toContain('<pre class="shiki"')
		expect(preHighlightedCodeHtml, 'Expected Shiki-Twoslash output to use line divs without newlines').toContain(`><div class='line'>`)
		runSharedAnnotationTest(preHighlightedCodeHtml)
	})

	// TODO: Add a test for Shiki-Twoslash with TS input that ran through Twoslash processing
})
