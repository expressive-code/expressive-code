import { type ElementContent } from 'hast'
import { Section } from './utils'
import { h, s } from 'hastscript'
import { collapsibleSectionClass } from './styles'

/**
 * Transforms a list of line ASTs into one containing the provided collapsible sections
 */
export function sectionizeAst({ lines, sections, text }: { lines: ElementContent[]; sections: Section[]; text: (count: number) => string }): ElementContent[] {
	const outp = [...lines]

	// icon yoinked from octicons (MIT licensed)
	const collapsedIconD =
		'm8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z'

	// by sorting from last to first, we're certain that the relevant lines can still be looked up by their index
	;[...sections]
		.sort((a, b) => b.to - a.to)
		.forEach(({ from, to }) => {
			const targetLines = lines.slice(from - 1, to)
			const $details = h('details', { class: collapsibleSectionClass }, [
				h('summary', [
					// icon yoinked from octicons (MIT licensed)
					s('svg', { xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': 'true', viewBox: '0 0 16 16', width: '16', height: '16' }, [
						s('path', {
							d: collapsedIconD,
							// unfortunately the `* { all: revert }` rule from the core library overwrites the d="..." of SVG paths
							// this re-adds the path data as a CSS style, to overwrite it back
							style: `d:path("${collapsedIconD}");`,
						}),
					]),
					text(targetLines.length),
				]),
				...targetLines,
			])
			outp.splice(from - 1, targetLines.length, $details)
		})

	return outp
}
