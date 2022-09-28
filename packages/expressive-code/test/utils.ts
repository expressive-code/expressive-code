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
export type Document = NonNullable<ReturnType<typeof parseDocument>>
export type ChildNode = Document['children'][0]

export type ParsedContent = {
	classes?: string[]
	markerType: MarkerType | undefined
	text?: string
	getEl?: () => Element
}

export class AnnotationResult {
	highlightedCode: ShikiOutput
	annotatedCode: ShikiOutput

	constructor({ highlightedCode, annotatedCode }: { highlightedCode: ShikiOutput; annotatedCode: ShikiOutput }) {
		this.highlightedCode = highlightedCode
		this.annotatedCode = annotatedCode
	}

	saveToFile(filePath: string) {
		const html = `
<html>
<body>
  <style>${baseCss}</style>

  <h2>Annotated code</h2>
  <div id="annotated">
    ${this.annotatedCode.html}
  </div><!--end:annotated-->

  <h2>Original Shiki-highlighted code</h2>
  <div id="highlighted">
    ${this.highlightedCode.html}
  </div><!--end:highlighted-->
</body>
</html>
		`
		const prettifiedHtml = prettifyHtml(html)
		writeFileSync(filePath, prettifiedHtml, 'utf8')
	}

	static loadFromFile(filePath: string) {
		const prettifiedHtml = readFileSync(filePath, 'utf8')
		const highlightedCodeHtml = prettifiedHtml.match(/<div id="highlighted">([\s\S]*?)<\/div\s*><!--end:highlighted-->/)?.[1] || ''
		const annotatedCodeHtml = prettifiedHtml.match(/<div id="annotated">([\s\S]*?)<\/div\s*><!--end:annotated-->/)?.[1] || ''

		return new AnnotationResult({
			highlightedCode: new ShikiOutput(highlightedCodeHtml),
			annotatedCode: new ShikiOutput(annotatedCodeHtml),
		})
	}
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

class ShikiOutput {
	html: string
	nodes: ChildNode[]
	allLines: Required<ParsedContent>[]

	constructor(html: string) {
		this.html = html
		this.nodes = parseDocument(html).children

		this.allLines = DomUtils
			// Get all divs containing the `line` class
			.findAll((el) => el.name === 'div' && el.attribs.class?.split(' ').includes('line'), this.nodes)
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
	}

	get shikiTokens() {
		return (
			DomUtils
				// Get all divs containing the `line` class
				.findAll((el) => el.name === 'span' && el.attribs.style !== undefined, this.nodes)
				// Map elements to properties required for the test
				.map((el) => {
					const style = el.attribs.style || ''
					const styles = new Map([...style.matchAll(/([^:\s]*)\s*:\s*((?:[^;&]*[^;&]*))(?:;|$)/g)].map(([, property, value]) => [property, value]))
					const color = styles.get('color')
					return {
						text: DomUtils.textContent(el),
						color,
						getStyles: () => styles,
						getEl: () => el,
					}
				})
		)
	}

	get lineMarkings() {
		return this.allLines.filter((line) => line.markerType !== undefined)
	}

	get inlineMarkings() {
		return (
			DomUtils
				// Get all HTML elements used for inline markings
				.findAll((el) => ['mark', 'ins', 'del'].includes(el.name), this.nodes)
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
		)
	}
}

export function getAnnotationResult(code: string, getAnnotationOptions?: GetAnnotationOptions): AnnotationResult {
	const { highlighter = defaultHighlighter, ...partialApplyAnnotationsOptions } = getAnnotationOptions || {}
	const applyAnnotationsOptions = { annotations: {}, lang: 'astro', ...partialApplyAnnotationsOptions }
	const { lang } = applyAnnotationsOptions
	const inputCodeLines = code.trim().split(/\r?\n/)

	// Run the code through shiki-twoslash first to get the syntax-highlighted HTML
	const highlightedCodeHtml = renderCodeToHTML(inputCodeLines.join('\n'), lang, {}, undefined, highlighter)
	const highlightedCode = new ShikiOutput(highlightedCodeHtml)

	// Now annotate the result
	const annotatedCodeHtml = applyAnnotations(highlightedCodeHtml, applyAnnotationsOptions)
	const annotatedCode = new ShikiOutput(annotatedCodeHtml)

	// Validate that the output code text without any annotations still equals the input code
	expect(inputCodeLines, 'Annotated code plaintext does not match input code!').toEqual(annotatedCode.allLines.map((line) => line.text))

	return new AnnotationResult({
		highlightedCode,
		annotatedCode,
	})
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

export type PrepareHtmlSnapshotOptions = {
	name: string
	annotationResult: AnnotationResult
}

export function prepareHtmlSnapshot(options: PrepareHtmlSnapshotOptions) {
	const { name, annotationResult } = options

	const snapshotBasePath = join(__dirname, '__html_snapshots__')
	const snapshotFileName = `${name}.html`
	const expectedFilePath = join(snapshotBasePath, snapshotFileName)
	const actualFilePath = join(snapshotBasePath, '__actual__', snapshotFileName)

	mkdirSync(dirname(actualFilePath), { recursive: true })
	annotationResult.saveToFile(actualFilePath)

	// Load both actual and expected from file to prevent
	// potential mismatches caused by prettifyHtml
	const actual = AnnotationResult.loadFromFile(actualFilePath)

	mkdirSync(dirname(expectedFilePath), { recursive: true })
	let expected: AnnotationResult
	try {
		expected = AnnotationResult.loadFromFile(expectedFilePath)
	} catch (error) {
		console.warn(`There is no expected HTML snapshot for "${name}" yet, creating it now`)
		annotationResult.saveToFile(expectedFilePath)
		expected = AnnotationResult.loadFromFile(expectedFilePath)
	}

	return {
		actual,
		expected,
	}
}
