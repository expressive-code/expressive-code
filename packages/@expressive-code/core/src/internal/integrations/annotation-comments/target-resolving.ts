import type { AnnotationComment } from 'annotation-comments'
import type { ExpressiveCodeBlock } from '../../../common/block'
import type { TransformAnchorFallback, TransformTarget } from '../../../common/transforms'

/**
 * Resolves parser target ranges into concrete block line/inline targets.
 */
export function getAnnotationCommentTargets(annotationComment: AnnotationComment, codeBlock: ExpressiveCodeBlock): TransformTarget[] {
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
			const columnStart = Math.max(0, Math.min(lineLength, targetRange.start.column ?? 0))
			const columnEnd = Math.max(columnStart, Math.min(lineLength, targetRange.end.column ?? lineLength))
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

/**
 * Derives the default insert direction from the relative target range sign.
 */
export function getDefaultInsertPosition(annotationComment: AnnotationComment): 'before' | 'after' {
	const { relativeTargetRange } = annotationComment.tag
	if (typeof relativeTargetRange === 'number' && relativeTargetRange < 0) return 'before'
	return 'after'
}

/**
 * Derives the default deleted-anchor fallback from the relative target range sign.
 */
export function getDefaultInsertOnDeleteLine(annotationComment: AnnotationComment): TransformAnchorFallback {
	const { relativeTargetRange } = annotationComment.tag
	if (typeof relativeTargetRange === 'number' && relativeTargetRange < 0) return 'stick-prev'
	return 'stick-next'
}

/**
 * Removes duplicate line/inline targets while keeping first-seen order.
 */
function dedupeTargets(targets: TransformTarget[]) {
	const seenTargets = new Set<string>()
	return targets.filter((target) => {
		const targetKey = target.inlineRange ? `${target.lineIndex}:${target.inlineRange.columnStart}:${target.inlineRange.columnEnd}` : `${target.lineIndex}`
		if (seenTargets.has(targetKey)) return false
		seenTargets.add(targetKey)
		return true
	})
}
