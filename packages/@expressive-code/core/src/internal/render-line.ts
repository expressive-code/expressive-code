import type { Element, Parents } from '../hast'
import { h } from '../hast'
import { ExpressiveCodeLine } from '../common/line'
import { AnnotationRenderPhase, AnnotationRenderPhaseOrder, ExpressiveCodeAnnotation } from '../common/annotation'
import { codeLineClass } from '../common/style-settings'
import { ExpressiveCodeHookContextBase, RenderEmptyLineFn } from '../common/plugin-hooks'
import { GutterElement } from '../common/gutter'
import { isHastElement, newTypeError } from './type-checks'

export function splitLineAtAnnotationBoundaries(line: ExpressiveCodeLine) {
	const textParts: string[] = []
	const partIndicesByAnnotation = new Map<ExpressiveCodeAnnotation, number[]>()
	const fullText = line.text
	const annotations = line.getAnnotations().filter((annotation) => annotation.processingOnly !== true)

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

export function renderLineToAst({
	line,
	lineIndex,
	gutterElements,
	...restContext
}: ExpressiveCodeHookContextBase & { line: ExpressiveCodeLine; lineIndex: number; gutterElements: PluginGutterElement[] }) {
	// Flatten intersecting annotations by splitting the line text into non-intersecting parts
	// and mapping annotations to the contained parts
	const { textParts, partIndicesByAnnotation } = splitLineAtAnnotationBoundaries(line)

	// Map the resulting parts to AST nodes
	const partNodes: Parents[] = textParts.map((textPart) => h(null, [textPart]))

	// Sort all annotations based on their render phase
	const annotations = [...line.getAnnotations()].filter((annotation) => annotation.processingOnly !== true).sort(renderPhaseSortFn)

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
		const renderOutput = annotation.render({ nodesToTransform: [...renderInput], line, lineIndex, ...restContext })
		validateAnnotationRenderOutput(renderOutput, renderInput.length)
		partIndices.forEach((partIndex, index) => {
			partNodes[partIndex] = renderOutput[index]
		})
	})

	// Sort gutter elements by their render phase and render them
	const sortedGutterElements = [...gutterElements].sort((a, b) => renderPhaseSortFn(a.gutterElement, b.gutterElement))
	const renderedGutterElements = sortedGutterElements.map(({ pluginName, gutterElement }) => {
		try {
			const node = gutterElement.renderLine({ ...restContext, line, lineIndex })
			if (!isHastElement(node)) throw new Error(`renderLine function did not return a valid HAST Element node: ${JSON.stringify(node)}`)
			return node
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			throw new Error(`Plugin "${pluginName}" failed to render a gutter element. Error message: ${msg}`, { cause: error })
		}
	})

	// Create a line node for all rendered parts
	let lineNode = h(`div.${codeLineClass}`)

	// If we have any gutter elements, wrap a gutter container around the elements
	// and add it to the line's nodes
	if (renderedGutterElements.length) {
		lineNode.children.push(h('div.gutter', renderedGutterElements))
	}

	// Now also wrap the code in a container and add it to the line's nodes
	// (in case the line is empty, insert a line break to ensure it still gets rendered)
	lineNode.children.push(h('div.code', partNodes.length > 0 ? partNodes : h(null, '\n')))

	// Render line-level annotations
	annotations.forEach((annotation) => {
		if (annotation.inlineRange) return
		const renderOutput = annotation.render({ nodesToTransform: [lineNode], line, lineIndex, ...restContext })
		validateAnnotationRenderOutput(renderOutput, 1)
		lineNode = renderOutput[0] as Element
		if (!isHastElement(lineNode)) {
			throw newTypeError('hast Element', lineNode, 'line-level annotation render output')
		}
	})

	return lineNode
}

export function getRenderEmptyLineFn(context: ExpressiveCodeHookContextBase & { gutterElements: PluginGutterElement[] }): RenderEmptyLineFn {
	return () => {
		const { gutterElements } = context

		// Sort gutter elements by their render phase and render placeholders for them
		const sortedGutterElements = [...gutterElements].sort((a, b) => renderPhaseSortFn(a.gutterElement, b.gutterElement))
		const renderedGutterElements = sortedGutterElements.map(({ pluginName, gutterElement }) => {
			try {
				const node = gutterElement.renderPlaceholder()
				if (!isHastElement(node)) throw new Error(`renderPlaceholder function did not return a valid HAST Element node: ${JSON.stringify(node)}`)
				return node
			} catch (error) {
				/* c8 ignore next */
				const msg = error instanceof Error ? error.message : (error as string)
				throw new Error(`Plugin "${pluginName}" failed to render a gutter element placeholder. Error message: ${msg}`, { cause: error })
			}
		})

		// Create a line node for all rendered parts
		const lineAst = h(`div.${codeLineClass}`)

		// If we have any gutter elements, wrap a gutter container around the elements
		// and add it to the line's nodes
		const gutterWrapper = renderedGutterElements.length ? h('div.gutter', renderedGutterElements) : undefined
		if (gutterWrapper) lineAst.children.push(gutterWrapper)

		// Now also wrap the code in a container and add it to the line's nodes
		const codeWrapper = h('div.code')
		lineAst.children.push(codeWrapper)

		return {
			lineAst,
			gutterWrapper,
			codeWrapper,
		}
	}
}

function renderPhaseSortFn(a: { renderPhase?: AnnotationRenderPhase | undefined }, b: { renderPhase?: AnnotationRenderPhase | undefined }) {
	const indexA = AnnotationRenderPhaseOrder.indexOf(a.renderPhase || 'normal')
	const indexB = AnnotationRenderPhaseOrder.indexOf(b.renderPhase || 'normal')
	return indexA - indexB
}

function validateAnnotationRenderOutput(nodes: Parents[], expectedLength: number) {
	if (!Array.isArray(nodes) || nodes.length !== expectedLength)
		throw new Error(`Expected annotation render function to return an array of ${expectedLength} node(s), but got ${JSON.stringify(nodes)}.`)
	nodes.forEach((node, nodeIndex) => {
		if (!node || !node.type) throw new Error(`Annotation render function returned an invalid node at index ${nodeIndex}: ${JSON.stringify(node)}`)
	})
}

export type PluginGutterElement = { pluginName: string; gutterElement: GutterElement }
