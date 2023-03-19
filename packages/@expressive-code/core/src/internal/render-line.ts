import { Parent } from 'hast-util-to-html/lib/types'
import { h } from 'hastscript'
import { ExpressiveCodeLine } from '../common/line'
import { annotationSortFn, ExpressiveCodeAnnotation } from '../common/annotation'

export function splitLineAtAnnotationBoundaries(line: ExpressiveCodeLine) {
	const textParts: string[] = []
	const partIndicesByAnnotation = new Map<ExpressiveCodeAnnotation, number[]>()
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
	annotations.forEach((annotation) => {
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
		partIndicesByAnnotation.set(annotation, partIndices)
	})

	return {
		textParts,
		partIndicesByAnnotation,
	}
}

export function renderLineToAst(line: ExpressiveCodeLine) {
	// Flatten intersecting annotations by splitting the line text into non-intersecting parts
	// and mapping annotations to the contained parts
	const { textParts, partIndicesByAnnotation } = splitLineAtAnnotationBoundaries(line)

	// Map the resulting parts to AST nodes
	const partNodes: Parent[] = textParts.map((textPart) => h(null, [textPart]))

	// Sort all annotations based on their render phase
	const annotations = [...line.getAnnotations()].sort(annotationSortFn)

	// Render inline annotations
	annotations.forEach((annotation, annotationIndex) => {
		if (!annotation.inlineRange) return

		// Get the part nodes that are contained within the current annotation
		const partIndices = partIndicesByAnnotation.get(annotation)
		/* c8 ignore next */
		if (!partIndices) throw new Error(`Failed to find inline annotation in part indices: ${JSON.stringify(annotation)}`)

		// Check if the part nodes can be merged into a single node
		if (partIndices.length > 1) {
			// Check if there are later annotations that include some,
			// but not all parts of this annotation
			const isPartiallyContainedInLaterAnnotations = annotations.slice(annotationIndex + 1).some((laterAnnotation) => {
				if (!laterAnnotation.inlineRange) return false
				const laterPartIndices = partIndicesByAnnotation.get(laterAnnotation)
				/* c8 ignore next */
				if (!laterPartIndices) return false
				const intersectingParts = laterPartIndices.filter((partIndex) => partIndices.includes(partIndex))
				const isPartiallyContained = intersectingParts.length > 0 && intersectingParts.length < partIndices.length

				return isPartiallyContained
			})
			// If this annotation is not only partially contained in later annotations,
			// we can now merge all of its parts into a single node
			if (!isPartiallyContainedInLaterAnnotations) {
				// Merge the affected nodes in partNodes
				const mergedNode = h(
					null,
					partIndices.map((partIndex) => partNodes[partIndex])
				)
				partNodes.splice(partIndices[0], partIndices.length, mergedNode)

				// Replace the indices of the affected parts with the index of the first part
				// and reduce the indices of all following parts accordingly
				const indicesToRemove = partIndices.length - 1
				const firstPartIndex = partIndices[0]
				const lastPartIndex = partIndices[partIndices.length - 1]
				partIndicesByAnnotation.forEach((partIndicesToCheck) => {
					let anyChanges = false
					const updatedIndices = partIndicesToCheck
						.map((partIndex) => {
							if (partIndex <= firstPartIndex) return partIndex
							anyChanges = true
							if (partIndex > lastPartIndex) return partIndex - indicesToRemove
							return NaN
						})
						.filter((partIndex) => !isNaN(partIndex))
					if (anyChanges) {
						// Replace contents of partIndicesToCheck with our new updated indices
						// (as this array is coming from partIndicesByAnnotation and
						// we are modifying it in place, this will also update partIndices
						// if we're updating the part indices for the current annotation)
						partIndicesToCheck.splice(0, partIndicesToCheck.length, ...updatedIndices)
					}
				})
			}
		}

		// Pass all part nodes to the annotation's render function
		const renderInput = partIndices.map((partIndex) => partNodes[partIndex])
		const renderOutput = annotation.render({ nodesToTransform: [...renderInput], line })
		validateAnnotationRenderOutput(renderOutput, renderInput.length)
		partIndices.forEach((partIndex, index) => {
			partNodes[partIndex] = renderOutput[index]
		})
	})

	// Now create a line node that contains all rendered part nodes
	let lineNode: Parent = h('div', partNodes)

	// Render line-level annotations
	annotations.forEach((annotation) => {
		if (annotation.inlineRange) return
		const renderOutput = annotation.render({ nodesToTransform: [lineNode], line })
		validateAnnotationRenderOutput(renderOutput, 1)
		lineNode = renderOutput[0]
	})

	return lineNode
}

function validateAnnotationRenderOutput(nodes: Parent[], expectedLength: number) {
	if (!Array.isArray(nodes) || nodes.length !== expectedLength)
		throw new Error(`Expected annotation render function to return an array of ${expectedLength} node(s), but got ${JSON.stringify(nodes)}.`)
	nodes.forEach((node, nodeIndex) => {
		if (!node || !node.type) throw new Error(`Annotation render function returned an invalid node at index ${nodeIndex}: ${JSON.stringify(node)}`)
	})
}
