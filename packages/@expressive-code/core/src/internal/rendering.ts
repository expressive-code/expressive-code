import { ExpressiveCodeAnnotation } from '../common/annotation'
import { ExpressiveCodeLine } from '../common/line'

export function splitLineAtAnnotationBoundaries(line: ExpressiveCodeLine) {
	const textParts: string[] = []
	const partIndicesByAnnotation = new Map<ExpressiveCodeAnnotation, number[]>()

	// Create an array of unique boundaries
	const annotationBoundaries = [
		...new Set(
			line.getAnnotations().flatMap(({ inlineRange }) => {
				if (!inlineRange) return []
				return [inlineRange.columnStart, inlineRange.columnEnd]
			})
		),
	].sort((a, b) => a - b)

	// Use the array of boundaries to split the line plaintext into parts
	const fullText = line.text
	let lastColumn = 0
	annotationBoundaries.forEach((column) => {
		if (column === lastColumn) return
		textParts.push(fullText.slice(lastColumn, column))
		lastColumn = column
	})
	if (lastColumn < fullText.length) textParts.push(fullText.slice(lastColumn))

	return {
		textParts,
		partIndicesByAnnotation,
	}
}
