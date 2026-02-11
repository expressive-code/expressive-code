import type { ExpressiveCodeLine } from '../common/line'
import type { TransformAnchorFallback } from '../common/transforms'

/**
 * Retargets line-bound copy and render transform annotations before deleting lines.
 *
 * Called by `ExpressiveCodeBlock.deleteLines` to keep transforms that opt into
 * `onDeleteLine` stickiness attached to the nearest surviving line.
 */
export function retargetTransformsOnDeletedLines(options: { lines: readonly ExpressiveCodeLine[]; deletedLineIndices: ReadonlySet<number> }) {
	const { lines, deletedLineIndices } = options
	const sortedDeletedLineIndices = [...deletedLineIndices].sort((a, b) => b - a)

	sortedDeletedLineIndices.forEach((deletedLineIndex) => {
		const deletedLine = lines[deletedLineIndex]
		if (!deletedLine) return

		retargetCopyInsertTransformsOnDeletedLine({
			deletedLine,
			lines,
			deletedLineIndices,
			deletedLineIndex,
		})

		retargetRenderTransformsOnDeletedLine({
			deletedLine,
			lines,
			deletedLineIndices,
			deletedLineIndex,
		})
	})
}

function retargetCopyInsertTransformsOnDeletedLine(options: {
	deletedLine: ExpressiveCodeLine
	lines: readonly ExpressiveCodeLine[]
	deletedLineIndices: ReadonlySet<number>
	deletedLineIndex: number
}) {
	const { deletedLine, lines, deletedLineIndices, deletedLineIndex } = options

	deletedLine.getCopyTransforms().forEach((transform) => {
		// removeLine/editText transforms are bound to their source line and should
		// disappear automatically when that line is deleted
		if (transform.type !== 'insertLines') return

		const target = resolveRetargetAnchor({
			lines,
			deletedLineIndices,
			deletedLineIndex,
			onDeleteLine: transform.onDeleteLine ?? 'drop',
		})
		if (!target) return
		transform.position = target.position
		deletedLine.deleteAnnotation(transform)
		lines[target.targetLineIndex]?.addAnnotation(transform)
	})
}

function retargetRenderTransformsOnDeletedLine(options: {
	deletedLine: ExpressiveCodeLine
	lines: readonly ExpressiveCodeLine[]
	deletedLineIndices: ReadonlySet<number>
	deletedLineIndex: number
}) {
	const { deletedLine, lines, deletedLineIndices, deletedLineIndex } = options

	deletedLine.getRenderTransforms().forEach((transform) => {
		const target = resolveRetargetAnchor({
			lines,
			deletedLineIndices,
			deletedLineIndex,
			onDeleteLine: transform.onDeleteLine,
		})
		if (!target) return
		transform.position = target.position
		deletedLine.deleteAnnotation(transform)
		lines[target.targetLineIndex]?.addAnnotation(transform)
	})
}

function resolveRetargetAnchor(options: {
	lines: readonly ExpressiveCodeLine[]
	deletedLineIndices: ReadonlySet<number>
	deletedLineIndex: number
	onDeleteLine: TransformAnchorFallback
}) {
	const { lines, deletedLineIndices, deletedLineIndex, onDeleteLine } = options
	if (onDeleteLine === 'drop') return

	let prevIndex: number | undefined
	for (let index = deletedLineIndex - 1; index >= 0; index--) {
		if (deletedLineIndices.has(index)) continue
		prevIndex = index
		break
	}

	let nextIndex: number | undefined
	for (let index = deletedLineIndex + 1; index < lines.length; index++) {
		if (deletedLineIndices.has(index)) continue
		nextIndex = index
		break
	}

	if (onDeleteLine === 'stick-prev') {
		if (prevIndex !== undefined) return { targetLineIndex: prevIndex, position: 'after' as const }
		if (nextIndex !== undefined) return { targetLineIndex: nextIndex, position: 'before' as const }
		return
	}

	if (nextIndex !== undefined) return { targetLineIndex: nextIndex, position: 'before' as const }
	if (prevIndex !== undefined) return { targetLineIndex: prevIndex, position: 'after' as const }
}
