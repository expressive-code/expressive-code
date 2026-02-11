import type { Element } from '../hast'
import type { ExpressiveCodeLine } from '../common/line'
import type { RenderEmptyLineFn } from '../common/plugin-hooks'
import type { RenderTransformAnnotation } from '../common/render-transforms'
import { isHastElement } from './type-checks'

/**
 * Applies render transforms to rendered AST lines and returns the transformed line list.
 *
 * Render transforms can insert additional rendered lines anchored to source lines without
 * mutating the underlying code plaintext.
 *
 * Used by the block renderer in `internal/render-block.ts`.
 */
export async function applyRenderTransforms(options: { lines: readonly ExpressiveCodeLine[]; renderedAstLines: Element[]; renderEmptyLine: RenderEmptyLineFn }) {
	const { lines, renderedAstLines, renderEmptyLine } = options
	const transformedLines: Array<{ lineAst: Element; sourceLine: ExpressiveCodeLine | undefined }> = renderedAstLines.map((lineAst, lineIndex) => ({
		lineAst,
		sourceLine: lines[lineIndex],
	}))
	const insertOperations: {
		anchorLine: ExpressiveCodeLine
		position: 'before' | 'after'
		transform: RenderTransformAnnotation
	}[] = []

	lines.forEach((line) => {
		line.getRenderTransforms().forEach((transform) => {
			insertOperations.push({
				anchorLine: line,
				position: transform.position,
				transform,
			})
		})
	})

	if (!insertOperations.length) return transformedLines.map((line) => line.lineAst)

	for (const operation of insertOperations) {
		const anchorIndex = transformedLines.findIndex((line) => line.sourceLine === operation.anchorLine)
		if (anchorIndex === -1) continue

		const renderedInsertLines = await renderInsertedLines({
			transform: operation.transform,
			renderEmptyLine,
		})
		if (!renderedInsertLines.length) continue

		const insertIndex = operation.position === 'before' ? anchorIndex : anchorIndex + 1
		transformedLines.splice(
			insertIndex,
			0,
			...renderedInsertLines.map((lineAst) => ({
				lineAst,
				sourceLine: undefined,
			}))
		)
	}

	return transformedLines.map((line) => line.lineAst)
}

async function renderInsertedLines(options: { transform: RenderTransformAnnotation; renderEmptyLine: RenderEmptyLineFn }) {
	const { transform, renderEmptyLine } = options
	const renderedOutput = await transform.insertRenderer({ renderEmptyLine })
	if (!renderedOutput) return []

	const renderedLines = Array.isArray(renderedOutput) ? renderedOutput : [renderedOutput]
	renderedLines.forEach((line, index) => {
		if (!isHastElement(line)) {
			throw new Error(`A render transform returned an invalid render transform line at index ${index}. Expected a valid HAST element, received: ${JSON.stringify(line)}`)
		}
	})
	return renderedLines
}
