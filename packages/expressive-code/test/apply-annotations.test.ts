import { describe, expect, test } from 'vitest'
import { applyAnnotations, ApplyAnnotationsOptions } from '../src/index'
import { createShikiHighlighter, renderCodeToHTML } from 'shiki-twoslash'
import { parseDocument, DomUtils } from 'htmlparser2'
import { MarkerType, MarkerTypeOrder } from '../src/common/annotations'

const highlighter = await createShikiHighlighter({})

type ExpectedLine = {
	classes?: string[]
	markerType?: MarkerType
	text?: string
}

type AnnotationResult = {
	lines?: ExpectedLine[]
	markedLines?: ExpectedLine[]
}

const getAnnotationResult = (code: string, options: ApplyAnnotationsOptions): AnnotationResult => {
	const { lang } = options
	const inputCodeLines = code.trim().split(/\r?\n/)

	// Run the code through shiki-twoslash first to get the syntax-highlighted HTML
	const highlightedCodeHtml = renderCodeToHTML(inputCodeLines.join('\n'), lang, {}, undefined, highlighter)

	// Now annotate the result
	const annotatedCodeHtml = applyAnnotations(highlightedCodeHtml, options)

	// Parse the annotated HTML output
	const nodes = parseDocument(annotatedCodeHtml).children
	const lines: ExpectedLine[] = DomUtils
		// Get all divs containing the `line` class
		.findAll((el) => el.name === 'div' && el.attribs.class?.split(' ').includes('line'), nodes)
		// Map elements to properties required for the test
		.map((el) => {
			const classes = el.attribs.class?.split(' ') || []
			return {
				classes,
				markerType: MarkerTypeOrder.find((markerType) => classes.includes(markerType.toString())),
				text: DomUtils.textContent(el),
				el,
			}
		})

	// Validate that the output code text without any annotations still equals the input code
	expect(inputCodeLines).toEqual(lines.map((line) => line.text))

	// Collect marked lines
	const markedLines = lines.filter((line) => line.markerType !== undefined)

	return {
		lines,
		markedLines,
	}
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const codeSnippet = `
---
import MyReactComponent from  '../components/MyReactComponent.jsx';
import MyAstroComponent from '../components/MyAstroComponent.astro';
---
<MyReactComponent>
	<MyAstroComponent slot="name" />
</MyReactComponent>
`

describe('Does not fail if there is nothing to do', () => {
	test('lineMarkings is undefined', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {},
			lang: 'astro',
		})

		expect(annotationResult.markedLines).toMatchObject<ExpectedLine[]>([])
	})

	test('lineMarkings is empty', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [],
			},
			lang: 'astro',
		})

		expect(annotationResult.markedLines).toMatchObject<ExpectedLine[]>([])
	})

	test('lineMarkings contains an empty lines array', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [] }],
			},
			lang: 'astro',
		})

		expect(annotationResult.markedLines).toMatchObject<ExpectedLine[]>([])
	})

	test('lineMarkings only contains non-existing lines', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [-1, 42] }],
			},
			lang: 'astro',
		})

		expect(annotationResult.markedLines).toMatchObject<ExpectedLine[]>([])
	})
})

describe('Correctly applies line markings', () => {
	test('Regular markings', () => {
		const singleLineResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [3] }],
			},
			lang: 'astro',
		})

		expect(singleLineResult.markedLines).toMatchObject<ExpectedLine[]>([
			{
				markerType: 'mark',
				text: `import MyAstroComponent from '../components/MyAstroComponent.astro';`,
			},
		])

		const multiLineResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [3, 6] }],
			},
			lang: 'astro',
		})

		expect(multiLineResult.markedLines).toMatchObject<ExpectedLine[]>([
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

	test('Insertions', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'ins', lines: [2, 3] }],
			},
			lang: 'astro',
		})

		expect(annotationResult.markedLines).toMatchObject<ExpectedLine[]>([
			{
				markerType: 'ins',
				text: `import MyReactComponent from  '../components/MyReactComponent.jsx';`,
			},
			{
				markerType: 'ins',
				text: `import MyAstroComponent from '../components/MyAstroComponent.astro';`,
			},
		])
	})

	test('Deletions', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ markerType: 'del', lines: [1, 2, 3, 4] }],
			},
			lang: 'astro',
		})

		expect(annotationResult.markedLines).toMatchObject<ExpectedLine[]>([
			{
				markerType: 'del',
				text: `---`,
			},
			{
				markerType: 'del',
				text: `import MyReactComponent from  '../components/MyReactComponent.jsx';`,
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
})
