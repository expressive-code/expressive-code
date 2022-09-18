import { expect } from 'vitest'
import { createShikiHighlighter, renderCodeToHTML } from 'shiki-twoslash'
import { parseDocument, DomUtils } from 'htmlparser2'
import { format } from 'prettier'
import { applyAnnotations, ApplyAnnotationsOptions } from '../src/index'
import { MarkerType, MarkerTypeOrder } from '../src/common/annotations'

export const createMarkerRegExp = (input: string) => {
	try {
		return new RegExp(input, 'dg')
	} catch (error) {
		return new RegExp(input, 'g')
	}
}

const defaultHighlighter = await createShikiHighlighter({})

export type Highlighter = Awaited<ReturnType<typeof createShikiHighlighter>>
export type Element = NonNullable<ReturnType<typeof DomUtils.findOne>>

export type ParsedContent = {
	classes?: string[]
	markerType: MarkerType | undefined
	text?: string
	getEl?: () => Element
}

export type AnnotationResult = {
	annotatedCodeHtml: string
	allLines: Required<ParsedContent>[]
	lineMarkings: Required<ParsedContent>[]
	inlineMarkings: Required<ParsedContent>[]
}

export type GetAnnotationOptions = Partial<ApplyAnnotationsOptions> & {
	highlighter?: Highlighter
}

export const getAnnotationResult = (code: string, getAnnotationOptions?: GetAnnotationOptions): AnnotationResult => {
	const { highlighter = defaultHighlighter, ...partialApplyAnnotationsOptions } = getAnnotationOptions || {}
	const applyAnnotationsOptions = { annotations: {}, lang: 'astro', ...partialApplyAnnotationsOptions }
	const { lang } = applyAnnotationsOptions
	const inputCodeLines = code.trim().split(/\r?\n/)

	// Run the code through shiki-twoslash first to get the syntax-highlighted HTML
	const highlightedCodeHtml = renderCodeToHTML(inputCodeLines.join('\n'), lang, {}, undefined, highlighter)

	// Now annotate the result
	const annotatedCodeHtml = applyAnnotations(highlightedCodeHtml, applyAnnotationsOptions)

	// Parse the annotated HTML output
	const nodes = parseDocument(annotatedCodeHtml).children
	const allLines: Required<ParsedContent>[] = DomUtils
		// Get all divs containing the `line` class
		.findAll((el) => el.name === 'div' && el.attribs.class?.split(' ').includes('line'), nodes)
		// Map elements to properties required for the test
		.map((el) => {
			const classes = el.attribs.class?.split(' ') || []
			return {
				classes,
				markerType: MarkerTypeOrder.find((markerType) => classes.includes(markerType.toString())),
				text: DomUtils.textContent(el),
				getEl: () => el,
			}
		})

	// Validate that the output code text without any annotations still equals the input code
	expect(inputCodeLines, 'Annotated code plaintext does not match input code!').toEqual(allLines.map((line) => line.text))

	// Collect line-level markings
	const lineMarkings = allLines.filter((line) => line.markerType !== undefined)

	// Collect inline markings
	const inlineMarkings = DomUtils
		// Get all HTML elements used for inline markings
		.findAll((el) => ['mark', 'ins', 'del'].includes(el.name), nodes)
		// Map elements to properties required for the test
		.map((el) => {
			const classes = el.attribs.class?.split(' ') || []
			return {
				classes,
				markerType: MarkerTypeOrder.find((markerType) => el.name === markerType.toString()),
				text: DomUtils.textContent(el),
				getEl: () => el,
			}
		})

	return {
		annotatedCodeHtml,
		allLines,
		lineMarkings,
		inlineMarkings,
	}
}

export const addPrettierHtmlSnapshotSerializer = () => {
	expect.addSnapshotSerializer({
		test(val) {
			return typeof val === 'string' && val.indexOf('<pre') > -1
		},
		serialize(val: string) {
			const preprocessed = val.replace(/<pre /g, '<Xpre ').replace(/<\/pre/g, '</Xpre')
			const formatted = format(preprocessed, { parser: 'html', useTabs: true, htmlWhitespaceSensitivity: 'strict' })
			const postprocessed = formatted.replace(/<Xpre /g, '<pre ').replace(/<\/Xpre/g, '</pre')
			return postprocessed
		},
	})
}
