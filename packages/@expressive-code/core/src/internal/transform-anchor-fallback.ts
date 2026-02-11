import type { TransformAnchorFallback } from '../common/transforms'

/**
 * Resolves a deleted-anchor fallback target from previous/next candidates.
 *
 * Used by copy and render transform processing to keep `onDeleteLine` behavior
 * consistent across code and render paths.
 */
export function resolveTransformAnchorFallback<T>(options: { onDeleteLine: TransformAnchorFallback; previous: T | undefined; next: T | undefined }) {
	const { onDeleteLine, previous, next } = options
	if (onDeleteLine === 'drop') return

	if (onDeleteLine === 'stick-prev') {
		if (previous !== undefined) return { anchor: previous, position: 'after' as const }
		if (next !== undefined) return { anchor: next, position: 'before' as const }
		return
	}

	if (next !== undefined) return { anchor: next, position: 'before' as const }
	if (previous !== undefined) return { anchor: previous, position: 'after' as const }
}
