import { formatTemplate, ExpressiveCodeBlock, RenderEmptyLineFn } from '@expressive-code/core'
import type { Element, ElementContent } from '@expressive-code/core/hast'
import { setInlineStyle, h } from '@expressive-code/core/hast'
import type { Section } from './utils'
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
	const { collapseStyle = 'github' } = codeBlock.props
	const outp = [...lines]

	// By sorting from last to first, we're certain that the relevant lines can still be looked up by their index
	;[...sections]
		.sort((a, b) => b.to - a.to)
		.forEach(({ from, to }) => {
			const contentLines = lines.slice(from - 1, to)

			// Determine information about the minimum indent level of the collapsed lines
			// unless disabled in the props
			const minIndent =
				codeBlock.props.collapsePreserveIndent !== false &&
				codeBlock.getLines(from - 1, to).reduce((acc, line) => {
					if (line.text.trim().length === 0) return acc
					return Math.min(acc, line.text.match(/^\s*/)?.[0].length ?? 0)
				}, Infinity)

			// Create the summary line for the collapsible section and wrap it in a summary element
			const summaryLine = renderEmptyLine()
			if (minIndent && minIndent < Infinity) setInlineStyle(summaryLine.lineAst, '--ecIndent', `${minIndent}ch`)
			summaryLine.codeWrapper.children.push(h('span.expand'), h('span.collapse'), h('span.text', formatTemplate(text, { lineCount: contentLines.length })))
			const summary = h('summary', summaryLine.lineAst)

			// Create an outer wrapper based on the collapse style
			const resolvedCollapseStyle = collapseStyle === 'collapsible-auto' ? (to >= lines.length ? 'collapsible-end' : 'collapsible-start') : collapseStyle
			const outerSelector = `.${collapsibleSectionClass}.${resolvedCollapseStyle}`
			let outerElement: Element
			if (collapseStyle === 'github') {
				outerElement = h(`details${outerSelector}`, [summary, ...contentLines])
			} else {
				outerElement = h(`div${outerSelector}`, [h(`details`, [summary]), h(`div.content-lines`, contentLines)])
			}

			outp.splice(from - 1, to - from + 1, outerElement)
		})

	return outp
}
