import type { AnnotationComment } from 'annotation-comments'
import type { ExpressiveCodeBlock } from '../../../common/block'
import type { TransformAnchorFallback, TransformTarget } from '../../../common/transforms'

export function resolveTargets(annotationComment: AnnotationComment, codeBlock: ExpressiveCodeBlock): TransformTarget[] {
	const targets: TransformTarget[] = []
	const codeLines = codeBlock.getLines()

	annotationComment.targetRanges.forEach((targetRange) => {
		const startLineIndex = targetRange.start.line
		const endLineIndex = targetRange.end.line
		const hasColumnInfo = targetRange.start.column !== undefined || targetRange.end.column !== undefined

		if (hasColumnInfo && startLineIndex === endLineIndex) {
			const line = codeLines[startLineIndex]
			if (!line) return
			const lineLength = line.text.length
			const columnStart = clamp(targetRange.start.column ?? 0, 0, lineLength)
			const columnEnd = clamp(targetRange.end.column ?? lineLength, columnStart, lineLength)
			if (columnEnd <= columnStart) return
			targets.push({
				line,
				lineIndex: startLineIndex,
				inlineRange: {
					columnStart,
					columnEnd,
				},
			})
			return
		}

		const rangeStartLineIndex = Math.min(startLineIndex, endLineIndex)
		const rangeEndLineIndex = Math.max(startLineIndex, endLineIndex)
		for (let lineIndex = rangeStartLineIndex; lineIndex <= rangeEndLineIndex; lineIndex++) {
			const line = codeLines[lineIndex]
			if (!line) continue
			targets.push({
				line,
				lineIndex,
			})
		}
	})

	return dedupeTargets(targets)
}

export function getDefaultInsertPosition(annotationComment: AnnotationComment): 'before' | 'after' {
	const { relativeTargetRange } = annotationComment.tag
	if (typeof relativeTargetRange === 'number' && relativeTargetRange < 0) return 'before'
	return 'after'
}

export function getDefaultInsertOnDeleteLine(annotationComment: AnnotationComment): TransformAnchorFallback {
	const { relativeTargetRange } = annotationComment.tag
	if (typeof relativeTargetRange === 'number' && relativeTargetRange < 0) return 'stick-prev'
	return 'stick-next'
}

function dedupeTargets(targets: TransformTarget[]) {
	const seenTargets = new Set<string>()
	return targets.filter((target) => {
		const targetKey = target.inlineRange ? `${target.lineIndex}:${target.inlineRange.columnStart}:${target.inlineRange.columnEnd}` : `${target.lineIndex}`
		if (seenTargets.has(targetKey)) return false
		seenTargets.add(targetKey)
		return true
	})
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value))
}
