import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { EOL } from 'os'
import { expect } from 'vitest'
import { getHighlighter, Highlighter, HighlighterOptions } from 'shiki'
import { parseDocument, DomUtils } from 'htmlparser2'
import chroma from 'chroma-js'
import * as HappyDOM from 'happy-dom'
import { applyAnnotations, ApplyAnnotationsOptions, getBaseCss } from '../src/index'
import { ColorMapping, MarkerType, MarkerTypeOrder } from '../src/common/annotations'

export function createMarkerRegExp(input: string) {
	try {
		return new RegExp(input, 'dg')
	} catch (error) {
		return new RegExp(input, 'g')
	}
}

export type DomUtilsElement = NonNullable<ReturnType<typeof DomUtils.findOne>>
export type Document = NonNullable<ReturnType<typeof parseDocument>>
export type ChildNode = Document['children'][0]

export type ParsedContent = {
	classes?: string[]
	markerType: MarkerType | undefined
	text?: string
	getEl?: () => DomUtilsElement
}

export class AnnotationResult {
	highlightedCode: ShikiOutput
	annotatedCode: ShikiOutput
	customColors: ColorMapping | undefined

	constructor({ highlightedCode, annotatedCode, customColors }: { highlightedCode: ShikiOutput; annotatedCode: ShikiOutput; customColors?: ColorMapping }) {
		this.highlightedCode = highlightedCode
		this.annotatedCode = annotatedCode
		this.customColors = customColors
	}

	toHtmlDocument() {
		const html = `
<!DOCTYPE html>
<html>
<body>
  <style>${getBaseCss(this.customColors)}</style>

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
		return prettifiedHtml
	}

	static fromHtmlDocument(prettifiedHtml: string) {
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
	preHighlightedCodeHtml?: string
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

function trimCodeBeforeHighlighting(code: string) {
	return code.trim().split(/\r?\n/).join('\n')
}

/**
 * Runs code through classic Shiki to get its classic syntax-highlighted HTML style
 * for compatibility testing purposes.
 */
export function getClassicShikiHighlightedCode(code: string, lang: string, highlighter: Highlighter = defaultHighlighter) {
	return highlighter.codeToHtml(trimCodeBeforeHighlighting(code), { lang })
}

export function getAnnotationResult(code: string, getAnnotationOptions?: GetAnnotationOptions): AnnotationResult {
	const { highlighter = defaultHighlighter, preHighlightedCodeHtml, ...partialApplyAnnotationsOptions } = getAnnotationOptions || {}
	const applyAnnotationsOptions = { annotations: {}, lang: 'astro', ...partialApplyAnnotationsOptions }
	const { lang } = applyAnnotationsOptions

	// If no preHighlightedCodeHtml was given, run the input code through the highlighter
	// to get the syntax-highlighted HTML
	const highlightedCodeHtml = preHighlightedCodeHtml || getClassicShikiHighlightedCode(code, lang, highlighter)
	const highlightedCode = new ShikiOutput(highlightedCodeHtml)

	// Now annotate the result
	const annotatedCodeHtml = applyAnnotations(highlightedCodeHtml, applyAnnotationsOptions)
	const annotatedCode = new ShikiOutput(annotatedCodeHtml)

	// Validate that the output code text without any annotations still equals the input code
	const inputCodePlaintext = trimCodeBeforeHighlighting(code).split('\n')
	const annotatedCodePlaintext = annotatedCode.allLines.map((line) => line.text)
	expect(inputCodePlaintext, 'Annotated code plaintext does not match input code!').toEqual(annotatedCodePlaintext)

	return new AnnotationResult({
		highlightedCode,
		annotatedCode,
		customColors: getAnnotationOptions?.customColors,
	})
}

function prettifyHtml(html: string) {
	let postprocessed = html
		.replace(/(><\/pre.*?>)/g, '\n    $1')
		.replace(/(><\/code.*?>)/g, '\n      $1')
		.replace(/(><div.*?>)/g, '\n      $1')
	if (EOL !== '\n') postprocessed = postprocessed.replace(/\n/g, EOL)
	return postprocessed
}

export type ElementColors = {
	text: chroma.Color
	background: chroma.Color
}

export type RunDomTestsFunc = ({
	domWindow,
	getCssVar,
	getElementColors,
}: {
	domWindow: HappyDOM.Window
	getCssVar: (varName: string) => string
	getElementColors: (element: HappyDOM.IElement, defaultStyles?: { text?: string; background?: string }) => ElementColors
}) => void

export type AnnotationResultToHtmlOptions = {
	testName: string
	annotationResult: AnnotationResult
	runDomTests?: RunDomTestsFunc
}

export function annotationResultToHtml(options: AnnotationResultToHtmlOptions) {
	const { testName, annotationResult, runDomTests } = options

	const snapshotBasePath = join(__dirname, '__html_snapshots__')
	const snapshotFileName = `${testName.replace(/[<>:"/\\|?*.]/g, '').toLowerCase()}.html`
	const snapshotFilePath = join(snapshotBasePath, '__actual__', snapshotFileName)

	// Write the snapshot to an HTML file for easy inspection of failed tests
	const htmlDocument = annotationResult.toHtmlDocument()
	mkdirSync(dirname(snapshotFilePath), { recursive: true })
	writeFileSync(snapshotFilePath, htmlDocument, 'utf8')

	if (runDomTests) {
		// Load snapshot into a virtual browser
		const domWindow = new HappyDOM.Window()
		const domDocument = domWindow.document
		domDocument.body.innerHTML = htmlDocument

		const styleBlocks = domWindow.document.querySelectorAll('style')
		const allStyleBlockContents = styleBlocks.map((styleBlock) => styleBlock.innerHTML).join('\n')

		runDomTests({
			domWindow,
			getCssVar: (varName) => {
				const varMatches = [...allStyleBlockContents.matchAll(new RegExp(`${varName}:\\s*(.*?)\\s*;`, 'g'))]
				if (varMatches.length !== 1) throw new Error(`Expected CSS variable "${varName}" to be defined exactly 1 time, but got ${varMatches.length} matches`)
				return varMatches[0][1]
			},
			getElementColors(element, defaultStyles) {
				const style = element && domWindow.getComputedStyle(element)
				return {
					text: chroma(style?.color || defaultStyles?.text || '#000'),
					background: chroma(style?.backgroundColor || defaultStyles?.background || '#fff'),
				}
			},
		})
	}
}
