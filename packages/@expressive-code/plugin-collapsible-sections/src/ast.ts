import { formatTemplate, setInlineStyle, ExpressiveCodeBlock, RenderEmptyLineFn } from '@expressive-code/core'
import { type ElementContent } from 'hast'
import { h, s } from 'hastscript'
import { Section } from './utils'
import { collapsibleSectionClass } from './styles'

/**
 * Transforms a list of line ASTs into one containing the provided collapsible sections
 */
export function sectionizeAst({
	codeBlock,
	lines,
	sections,
	text,
	renderEmptyLine,
}: {
	codeBlock: ExpressiveCodeBlock
	lines: ElementContent[]
	sections: Section[]
	text: string
	renderEmptyLine: RenderEmptyLineFn
}): ElementContent[] {
	const outp = [...lines]

	// icon yoinked from octicons (MIT licensed)
	const collapsedIconD =
		'm8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z'

	// by sorting from last to first, we're certain that the relevant lines can still be looked up by their index
	;[...sections]
		.sort((a, b) => b.to - a.to)
		.forEach(({ from, to }) => {
			const targetLines = lines.slice(from - 1, to)

			// Create the summary line for the collapsible section
			const summaryLine = renderEmptyLine()
			summaryLine.codeWrapper.children.push(
				s('svg', { xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': 'true', viewBox: '0 0 16 16', width: '16', height: '16' }, [s('path', { d: collapsedIconD })]),
				{ type: 'text', value: formatTemplate(text, { lineCount: targetLines.length }) }
			)
			// Wrap it in a summary element, and then in a details element with the target lines
			const summary = h('summary', [summaryLine.lineAst])
			const details = h('details', { class: collapsibleSectionClass }, [summary, ...targetLines])
			// Add information about the minimum indent level of the collapsed lines
			// unless disabled in the props
			if (codeBlock.props.collapsePreserveIndent !== false) {
				const minIndent = codeBlock.getLines(from - 1, to).reduce((acc, line) => {
					if (line.text.trim().length === 0) return acc
					return Math.min(acc, line.text.match(/^\s*/)?.[0].length ?? 0)
				}, Infinity)
				if (minIndent > 0 && minIndent < Infinity) setInlineStyle(summaryLine.lineAst, '--ecIndent', `${minIndent}ch`)
			}

			outp.splice(from - 1, targetLines.length, details)
		})

	return outp
}
