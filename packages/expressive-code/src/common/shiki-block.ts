import { ShikiLine } from './shiki-line'
import { LineMarkingDefinition, InlineMarkingDefinition, MarkerTypeOrder } from './annotations'

export class ShikiBlock {
	private htmlBeforeFirstLine = ''
	private shikiLines: ShikiLine[] = []
	private htmlAfterLastLine = ''

	constructor(highlightedCodeHtml: string) {
		if (!highlightedCodeHtml) return

		const codeBlockRegExp = /^\s*(<pre.*?>(?:<div class="language-id">.*?<\/div>)?(?:<div class='code-container'>)?<code.*?>)([\s\S]*)(<\/code>(?:<\/div>)?<\/pre>)\s*$/
		const matches = highlightedCodeHtml.match(codeBlockRegExp)
		if (!matches) throw new Error(`Shiki-highlighted code block HTML did not match expected format. HTML code:\n${highlightedCodeHtml}`)

		this.htmlBeforeFirstLine = matches[1]
		const innerHtml = matches[2]
		this.htmlAfterLastLine = matches[3]

		// Parse inner HTML code into ShikiLine instances, supporting both Shiki and Shiki Twoslash
		// line formats (Shiki Twoslash uses divs, while Shiki uses spans separated by newlines)
		this.shikiLines = innerHtml
			// Add newlines between Shiki Twoslash line divs to unify both supported formats
			.replace(/(<\/div>)(<div class=["']line)/g, '$1\n$2')
			// Now we can split both Shiki and Shiki Twoslash formats by newlines
			.split(/\r?\n/)
			// Map each line to a ShikiLine instance
			.map((htmlLine) => new ShikiLine(htmlLine))
	}

	applyMarkings(lineMarkings: LineMarkingDefinition[], inlineMarkings: InlineMarkingDefinition[]) {
		if (!lineMarkings.length && !inlineMarkings.length) return

		this.shikiLines.forEach((line, i) => {
			// Determine line marker type (if any)
			const matchingDefinitions = lineMarkings.filter((def) => def.lines.includes(i + 1))
			if (matchingDefinitions) {
				const markerTypes = matchingDefinitions.map((def) => def.markerType)
				markerTypes.sort((a, b) => MarkerTypeOrder.indexOf(a) - MarkerTypeOrder.indexOf(b))
				const highestPrioMarkerType = markerTypes[0]
				line.setLineMarkerType(highestPrioMarkerType)
			}

			line.applyInlineMarkings(inlineMarkings)
		})
	}

	renderToHtml() {
		const linesHtml = this.shikiLines
			.map((line) => {
				line.ensureTokenColorContrast()
				return line.renderToHtml()
			})
			.join('')

		return `${this.htmlBeforeFirstLine}${linesHtml}${this.htmlAfterLastLine}`
	}
}
