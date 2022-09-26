import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { EOL } from 'os'
import { expect } from 'vitest'
import { getHighlighter, Highlighter, HighlighterOptions } from 'shiki'
import { renderCodeToHTML } from 'shiki-twoslash'
import { parseDocument, DomUtils } from 'htmlparser2'
import { format } from 'prettier'
import { applyAnnotations, ApplyAnnotationsOptions, baseCss } from '../src/index'
import { MarkerType, MarkerTypeOrder } from '../src/common/annotations'

export function createMarkerRegExp(input: string) {
	try {
		return new RegExp(input, 'dg')
	} catch (error) {
		return new RegExp(input, 'g')
	}
}

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

export async function createHighlighter(settings: HighlighterOptions = { theme: 'light-plus' }) {
	if (settings.themes) throw new Error('The "themes" setting is not supported in tests, you must use a single "theme".')

	const highlighter = await getHighlighter(settings)
	return highlighter
}

const defaultHighlighter = await createHighlighter({})

export function getAnnotationResult(code: string, getAnnotationOptions?: GetAnnotationOptions): AnnotationResult {
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

function prettifyHtml(html: string) {
	const preprocessed = html
		.replace(/<pre /g, '<Xpre ')
		.replace(/<\/pre/g, '</Xpre')
		.replace(/(>)([ \t]+)/g, (_, start: string, whitespace: string) => {
			return `${start}${whitespace.replace(/ /g, '&#0032;').replace(/\t/g, '&#0009;')}`
		})
	const formatted = format(preprocessed, {
		parser: 'html',
		useTabs: true,
		htmlWhitespaceSensitivity: 'strict',
		printWidth: 9999,
		// Try to match the most likely git repo setting
		endOfLine: EOL === '\n' ? 'cr' : 'crlf',
	})
	const postprocessed = formatted
		.replace(/(>)((&#0032;|&#0009;)+)/g, (_, start: string, whitespace: string) => {
			return `${start}${whitespace.replace(/&#0032;/g, ' ').replace(/&#0009;/g, '\t')}`
		})
		.replace(/<Xpre /g, '<pre ')
		.replace(/<\/Xpre/g, '</pre')
	return postprocessed
}

export type ExpectHtmlSnapshotMatchOptions = {
	name: string
	annotationResult: AnnotationResult
}

export function expectHtmlSnapshotMatch(options: ExpectHtmlSnapshotMatchOptions) {
	const { name, annotationResult } = options

	const snapshotBasePath = join(__dirname, '__html_snapshots__')
	const snapshotFileName = `${name}.html`
	const expectedFilePath = join(snapshotBasePath, snapshotFileName)
	const actualFilePath = join(snapshotBasePath, '__actual__', snapshotFileName)

	const actualHtml = `
<html>
<body>
  <style>${baseCss}</style>
  ${annotationResult.annotatedCodeHtml}
</body>
</html>
	`
	const prettifiedActualHtml = prettifyHtml(actualHtml)
	mkdirSync(dirname(actualFilePath), { recursive: true })
	writeFileSync(actualFilePath, prettifiedActualHtml, 'utf8')

	mkdirSync(dirname(expectedFilePath), { recursive: true })
	let expectedHtml: string
	try {
		expectedHtml = readFileSync(expectedFilePath, 'utf8')
	} catch (error) {
		console.warn(`There is no expected HTML snapshot for "${name}" yet, creating it now`)
		writeFileSync(expectedFilePath, prettifiedActualHtml, 'utf8')
		expectedHtml = prettifiedActualHtml
	}
	expect(prettifiedActualHtml, `Expected HTML for snapshot "${name}" did not match actual HTML`).toEqual(expectedHtml)
}
