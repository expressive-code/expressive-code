import { ExpressiveCodeLine } from '@expressive-code/core'

export type Section = { from: number; to: number; lines: ExpressiveCodeLine[] }

/** Transforms a meta string of sections (e.g. '1-2, 4-8') into a list of section objects */
export function parseSections(value: string): Section[] {
	const sections: Section[] = []
	value
		.split(',')
		.map((section) => section.split('-').map((lineNum: string) => parseInt(lineNum)))
		.forEach((list) => {
			// skip any entries that don't have exactly 2 entries (e.g. '1-2-3' or '1-')
			if (list.length !== 2) return
			const [from, to] = list

			// skip any entries that failed to parse as numbers
			if (isNaN(from) || isNaN(to)) return

			// skip any entries that aren't increasing
			if (from > to) return

			// skip any entries that overlap existing sections, since our <details>-based approach can't overlap
			for (const { from: existingFrom, to: existingTo } of sections) {
				if (from >= existingFrom && from <= existingTo) return
				if (to >= existingFrom && to <= existingTo) return
			}

			sections.push({ from, to, lines: [] })
		})
	return sections
}

const collapseStyles = ['github', 'foldable-top', 'foldable-bottom', 'foldable-auto'] as const
export type CollapseStyle = (typeof collapseStyles)[number]

export function parseCollapseStyle(value: string): CollapseStyle {
	value = value.toLowerCase()
	if (collapseStyles.includes(value as CollapseStyle)) return value as CollapseStyle
	return 'github'
}
