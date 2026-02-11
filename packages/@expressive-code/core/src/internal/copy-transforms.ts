import type { ExpressiveCodeLine } from '../common/line'
import type { TransformAnchorFallback } from '../common/transforms'
import { resolveTransformAnchorFallback } from './transform-anchor-fallback'

type CopyLineOperation =
	| {
			type: 'removeLine'
			sourceLine: ExpressiveCodeLine
			originalLineIndex: number
			order: number
	  }
	| {
			type: 'editLine'
			sourceLine: ExpressiveCodeLine
			originalLineIndex: number
			startColumn: number
			endColumn: number
			replacementLines: string[]
			order: number
	  }

type CopyInsertOperation = {
	position: 'before' | 'after'
	lines: string[]
	anchorLine: ExpressiveCodeLine
	anchorOriginalLineIndex: number
	onDeleteLine: TransformAnchorFallback
	order: number
}

/**
 * Applies registered copy transforms to the current block lines and returns clipboard plaintext.
 *
 * It resolves anchors, normalizes operation ordering, and applies removeLine/editLine/insertLines
 * operations deterministically to avoid index drift and overlap issues.
 *
 * Used by `ExpressiveCodeBlock.getCopyText` in `common/block.ts`.
 */
export function applyCopyTransforms(options: { lines: readonly ExpressiveCodeLine[] }) {
	const { lines } = options
	const copiedLines: Array<{ text: string; sourceLine: ExpressiveCodeLine | undefined }> = lines.map((line) => ({
		text: line.text,
		sourceLine: line,
	}))
	const lineIndices = new Map(lines.map((line, lineIndex) => [line, lineIndex]))

	// We collect operations first and apply them later in a controlled order
	// This avoids index drift while we still analyze all transforms
	const lineOperations: CopyLineOperation[] = []
	const insertOperations: CopyInsertOperation[] = []
	let order = 0

	lines.forEach((line, lineIndex) => {
		line.getCopyTransforms().forEach((transform) => {
			const transformOrder = order++
			if (transform.type === 'insertLines') {
				insertOperations.push({
					position: transform.position ?? 'after',
					onDeleteLine: transform.onDeleteLine ?? 'stick-next',
					lines: transform.lines ? [...transform.lines] : [],
					anchorLine: line,
					anchorOriginalLineIndex: lineIndex,
					order: transformOrder,
				})
				return
			}

			if (transform.type === 'removeLine') {
				lineOperations.push({
					type: 'removeLine',
					sourceLine: line,
					originalLineIndex: lineIndex,
					order: transformOrder,
				})
				return
			}

			const inlineRange = transform.inlineRange
			lineOperations.push({
				type: 'editLine',
				sourceLine: line,
				originalLineIndex: lineIndex,
				startColumn: inlineRange?.columnStart ?? 0,
				endColumn: inlineRange?.columnEnd ?? line.text.length,
				replacementLines: inlineRange ? [normalizeNewTextLines(transform.newText ?? '').join('')] : normalizeNewTextLines(transform.newText ?? ''),
				order: transformOrder,
			})
		})
	})

	if (!lineOperations.length && !insertOperations.length) return copiedLines.map((line) => line.text).join('\n')

	// Deterministic conflict handling for operations that hit the same line:
	// 1) higher original line index first
	// 2) removeLine > editLine
	// 3) for editLine/editLine conflicts: later columns first (right-to-left patching)
	// 4) finally registration order (later registered wins)
	const operationPriority = {
		removeLine: 0,
		editLine: 1,
	} as const

	lineOperations.sort((a, b) => {
		if (a.originalLineIndex !== b.originalLineIndex) return b.originalLineIndex - a.originalLineIndex
		const priorityDiff = operationPriority[a.type] - operationPriority[b.type]
		if (priorityDiff !== 0) return priorityDiff
		if (a.type === 'editLine' && b.type === 'editLine') {
			if (a.startColumn !== b.startColumn) return b.startColumn - a.startColumn
			if (a.endColumn !== b.endColumn) return b.endColumn - a.endColumn
		}
		return b.order - a.order
	})

	lineOperations.forEach((operation) => {
		const anchoredLineIndex = copiedLines.findIndex((line) => line.sourceLine === operation.sourceLine)

		if (operation.type === 'removeLine') {
			if (anchoredLineIndex < 0) return
			copiedLines.splice(anchoredLineIndex, 1)
			return
		}

		// If a line was already removed by a previous operation, any edits to that line are discarded
		if (anchoredLineIndex < 0) return

		const lineEntry = copiedLines[anchoredLineIndex]
		if (!lineEntry) return
		const startColumn = Math.min(Math.max(operation.startColumn, 0), lineEntry.text.length)
		const endColumn = Math.min(Math.max(operation.endColumn, startColumn), lineEntry.text.length)
		const prefix = lineEntry.text.slice(0, startColumn)
		const suffix = lineEntry.text.slice(endColumn)
		if (operation.replacementLines.length <= 1) {
			lineEntry.text = prefix + (operation.replacementLines[0] ?? '') + suffix
			return
		}
		const editedLines = operation.replacementLines.map((lineText, editedLineIndex) => ({
			text: editedLineIndex === 0 ? prefix + lineText : editedLineIndex === operation.replacementLines.length - 1 ? lineText + suffix : lineText,
			sourceLine: editedLineIndex === 0 ? operation.sourceLine : undefined,
		}))
		copiedLines.splice(anchoredLineIndex, 1, ...editedLines)
	})

	// Keep insert operations in registration order
	insertOperations.forEach((operation) => {
		if (!operation.lines.length) return
		const resolvedInsertTarget = resolveLineCopyInsertAnchor({
			copiedLines,
			lineIndices,
			operation,
		})
		if (!resolvedInsertTarget) return
		const insertIndex = resolvedInsertTarget.position === 'before' ? resolvedInsertTarget.anchor : resolvedInsertTarget.anchor + 1
		copiedLines.splice(
			insertIndex,
			0,
			...operation.lines.map((line) => ({
				text: line,
				sourceLine: undefined,
			}))
		)
	})

	return copiedLines.map((line) => line.text).join('\n')
}

function normalizeNewTextLines(newText: string | string[]) {
	if (Array.isArray(newText)) return [...newText]
	return [newText]
}

function resolveLineCopyInsertAnchor(options: {
	copiedLines: Array<{ text: string; sourceLine: ExpressiveCodeLine | undefined }>
	lineIndices: Map<ExpressiveCodeLine, number>
	operation: CopyInsertOperation
}) {
	const { copiedLines, lineIndices, operation } = options
	const currentAnchorIndex = copiedLines.findIndex((line) => line.sourceLine === operation.anchorLine)
	if (currentAnchorIndex !== -1) {
		return {
			anchor: currentAnchorIndex,
			position: operation.position,
		}
	}

	const sourceLineIndices = copiedLines
		.map((line, currentIndex) => {
			if (!line.sourceLine) return
			const sourceLineIndex = lineIndices.get(line.sourceLine)
			if (sourceLineIndex === undefined) return
			return {
				currentIndex,
				sourceLineIndex,
			}
		})
		.filter((lineIndex): lineIndex is { currentIndex: number; sourceLineIndex: number } => !!lineIndex)
	const nextLine = sourceLineIndices.filter((lineIndex) => lineIndex.sourceLineIndex > operation.anchorOriginalLineIndex).sort((a, b) => a.sourceLineIndex - b.sourceLineIndex)[0]
	const previousLine = sourceLineIndices
		.filter((lineIndex) => lineIndex.sourceLineIndex < operation.anchorOriginalLineIndex)
		.sort((a, b) => b.sourceLineIndex - a.sourceLineIndex)[0]

	return resolveTransformAnchorFallback({
		onDeleteLine: operation.onDeleteLine,
		previous: previousLine?.currentIndex,
		next: nextLine?.currentIndex,
	})
}
