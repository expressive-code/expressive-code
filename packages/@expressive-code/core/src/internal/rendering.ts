import { ExpressiveCodeLine } from '../common/line'

export function splitLineAtAnnotationBoundaries(line: ExpressiveCodeLine) {
	const textParts: string[] = []
	const partIndicesByAnnotationIndex = new Map<number, number[]>()
	const fullText = line.text
	const annotations = line.getAnnotations()

	// Create an array of unique boundaries
	const annotationBoundaries = [
		...new Set(
			annotations.flatMap(({ inlineRange }) => {
				if (!inlineRange) return []
				return [inlineRange.columnStart, inlineRange.columnEnd]
			})
		),
	].sort((a, b) => a - b)

	// Use the array of boundaries to split the line plaintext into parts
	let lastColumn = 0
	annotationBoundaries.forEach((column) => {
		if (column === lastColumn) return
		textParts.push(fullText.slice(lastColumn, column))
		lastColumn = column
	})
	if (lastColumn < fullText.length) textParts.push(fullText.slice(lastColumn))

	// Build a list of part indices contained within each annotation
	annotations.forEach((annotation, annotationIndex) => {
		if (!annotation.inlineRange) return
		const { columnStart, columnEnd } = annotation.inlineRange
		const partIndices: number[] = []
		let partStart = 0
		textParts.forEach((part, partIndex) => {
			const partEnd = partStart + part.length
			// If the part is completely contained within the current annotation's column range,
			// add its part index to the list of part indices for the annotation
			if (partStart >= columnStart && partEnd <= columnEnd) {
				partIndices.push(partIndex)
			}
			partStart = partEnd
		})
		partIndicesByAnnotationIndex.set(annotationIndex, partIndices)
	})

	return {
		textParts,
		partIndicesByAnnotationIndex,
	}
}
