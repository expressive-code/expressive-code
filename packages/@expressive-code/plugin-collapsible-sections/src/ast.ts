import { type ElementContent } from 'hast'
import { Section } from './utils'
import { h } from 'hastscript'
import { collapsibleSectionClass } from './styles'

/**
 * Text to display in the <summary> of a collapsed section
 * Can contain the placeholder '{count}'
 */
type SectionText = string

/**
 * Transforms a list of line ASTs into one containing the provided collapsible sections
 */
export function sectionizeAst({
	lines,
	sections,
	text = '{count} collapsed lines',
}: {
	lines: ElementContent[]
	sections: Section[]
	text?: SectionText | undefined
}): ElementContent[] {
	const outp = [...lines]

	// by sorting from last to first, we're certain that the relevant lines can still be looked up by their index
	;[...sections]
		.sort((a, b) => b.to - a.to)
		.forEach(({ from, to }) => {
			const targetLines = lines.slice(from - 1, to)
			const $details = h('details', { class: collapsibleSectionClass }, [h('summary', [text.replace(/\{count\}/g, `${targetLines.length}`)]), ...targetLines])
			outp.splice(from - 1, targetLines.length, $details)
		})

	return outp
}
