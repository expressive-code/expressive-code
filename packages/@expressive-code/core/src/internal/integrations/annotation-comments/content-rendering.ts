import type { Element, ElementContent, Parents } from '../../../hast'
import type { AnnotationBaseOptions, AnnotationRenderOptions } from '../../../common/annotation'
import type {
	AnnotationCommentContentContext,
	AnnotationCommentContentPlacementContext,
	AnnotationCommentContentRenderContext,
	AnnotationCommentContentRenderPlacement,
	AnnotationCommentContentRenderer,
	AnnotationCommentHandler,
} from '../../../common/annotation-comments'
import type { TransformTarget } from '../../../common/transforms'
import { fromInlineMarkdown, h, select, setInlineStyle } from '../../../hast'
import { ExpressiveCodeAnnotation } from '../../../common/annotation'
import { getLeadingWhitespaceColumns } from '../../indentation'
import { isHastElement } from '../../type-checks'
import { getDefaultInsertOnDeleteLine } from './target-resolving'

type ResolvedAnnotationCommentContentPlacement = AnnotationCommentContentPlacementContext & {
	anchorStart: number
	anchorEnd: number
}

/**
 * Annotation that injects pre-rendered annotation comment content into a rendered line AST.
 */
class AnnotationCommentContentAnnotation extends ExpressiveCodeAnnotation {
	name = 'Annotation comment rendered content'
	readonly contentWrapper: Element
	readonly insertAtStart: boolean
	readonly parentLine: ((options: { lineAst: Element; contentWrapper: Element }) => Element | undefined) | undefined

	constructor(
		options: {
			contentWrapper: Element
			insertAtStart: boolean
			parentLine?: ((options: { lineAst: Element; contentWrapper: Element }) => Element | undefined) | undefined
		} & AnnotationBaseOptions
	) {
		super(options)
		this.contentWrapper = options.contentWrapper
		this.insertAtStart = options.insertAtStart
		this.parentLine = options.parentLine
	}

	/**
	 * Inserts the prepared content wrapper into each target line and runs the optional line hook.
	 */
	render({ nodesToTransform }: AnnotationRenderOptions): Parents[] {
		return nodesToTransform.map((node) => {
			if (node.type !== 'element') return node

			const target = select('.code', node) ?? node
			if (this.insertAtStart) {
				target.children.unshift(this.contentWrapper)
			} else {
				target.children.push(this.contentWrapper)
			}
			return (
				this.parentLine?.({
					lineAst: node,
					contentWrapper: this.contentWrapper,
				}) ?? node
			)
		})
	}
}

/**
 * Applies optional `content.render` convenience behavior for annotation comment handlers.
 *
 * It resolves render placements, renders content, and injects the result either inline
 * or via generated lines depending on the resolved placement.
 */
export async function applyContentRenderConvenience(options: { handler: AnnotationCommentHandler; context: AnnotationCommentContentContext }) {
	const { handler, context } = options
	const renderOptions = handler.content?.render
	if (!renderOptions) return
	if (!context.content.lines.length) return

	const renderPlacements = await getContentRenderPlacements({
		context,
		placementOption: renderOptions.placement,
	})
	if (!renderPlacements.length) return

	for (const renderPlacement of renderPlacements) {
		const renderContext: AnnotationCommentContentRenderContext = {
			...context,
			placement: renderPlacement.placement,
			annotationTarget: renderPlacement.annotationTarget,
			contentRenderLine: renderPlacement.contentRenderLine,
			contentRenderColumn: renderPlacement.contentRenderColumn,
		}
		const renderedContent = await renderContentNodes({
			context: renderContext,
			renderer: renderOptions.contentRenderer,
		})

		// Create default content wrapper with placement classes and CSS variables for anchor positions
		let contentWrapper = renderContentWrapperElement({
			placement: renderPlacement.placement,
			anchorStart: renderPlacement.anchorStart,
			anchorEnd: renderPlacement.anchorEnd,
			contentRenderColumn: renderPlacement.contentRenderColumn,
		})
		contentWrapper.children.push(...renderedContent)

		// Run `content.render.contentWrapper` hook (if any), allowing it to modify or replace
		// the generated wrapper before it's injected into the host line
		if (renderOptions.contentWrapper) {
			const transformedWrapper = await renderOptions.contentWrapper({
				...renderContext,
				renderedContent,
				contentWrapper,
			})
			if (transformedWrapper) {
				if (!isHastElement(transformedWrapper)) {
					throw new Error('content.render.contentWrapper must return a valid HAST element')
				}
				contentWrapper = transformedWrapper
			}
		}

		if (renderPlacement.placement.line !== 'current') {
			renderPlacement.contentRenderLine.addRenderTransform({
				type: 'insert',
				position: renderPlacement.placement.line === 'before' ? 'before' : 'after',
				onDeleteLine: getDefaultInsertOnDeleteLine(context.annotationComment),
				render: ({ renderEmptyLine }) => {
					const emptyLine = renderEmptyLine()
					const preserveIndent = renderPlacement.placement.preserveIndent ?? true
					if (preserveIndent) {
						const indent = getLeadingWhitespaceColumns(renderPlacement.contentRenderLine.text)
						if (indent > 0) setInlineStyle(emptyLine.lineAst, '--ecIndent', `${indent}ch`)
					}
					emptyLine.codeWrapper.children.push(contentWrapper)
					// Run `content.render.parentLine` hook (if any) on generated lines
					return (
						renderOptions.parentLine?.({
							...renderContext,
							contentWrapper,
							lineAst: emptyLine.lineAst,
							isGeneratedLine: true,
						}) ?? emptyLine.lineAst
					)
				},
			})
			continue
		}

		renderPlacement.contentRenderLine.addAnnotation(
			new AnnotationCommentContentAnnotation({
				contentWrapper,
				insertAtStart: renderPlacement.contentRenderColumn === 0,
				parentLine: ({ lineAst, contentWrapper }) =>
					// Run `content.render.parentLine` hook (if any) on existing lines
					renderOptions.parentLine?.({
						...renderContext,
						contentWrapper,
						lineAst,
						isGeneratedLine: false,
					}) ?? lineAst,
				renderPhase: 'latest',
			})
		)
	}
}

/**
 * Resolves and normalizes all configured content placements for one annotation comment.
 */
async function getContentRenderPlacements(options: {
	context: AnnotationCommentContentContext
	placementOption: NonNullable<NonNullable<AnnotationCommentHandler['content']>['render']>['placement']
}): Promise<ResolvedAnnotationCommentContentPlacement[]> {
	const { context, placementOption } = options
	const { annotationComment, codeBlock, targets } = context

	const annotationLineIndex = annotationComment.commentRange.start.line
	const annotationLine = codeBlock.getLine(annotationLineIndex)
	if (!annotationLine) return []

	// Run `content.render.placement` hook (if any) or use the given input(s),
	// with a single default placement as fallback
	const placementInputOrInputs = (typeof placementOption === 'function' ? await placementOption(context) : placementOption) ?? [undefined]
	const placementInputs = Array.isArray(placementInputOrInputs) ? placementInputOrInputs : [placementInputOrInputs]
	if (!placementInputs.length) return []

	// Convert the placement inputs into fully resolved placements ready for rendering and injection
	const renderPlacements: ResolvedAnnotationCommentContentPlacement[] = []
	placementInputs.forEach((placementInput) => {
		// Apply defaults to placement properties
		const line = placementInput?.line ?? 'current'
		const placement: AnnotationCommentContentRenderPlacement = {
			anchor: placementInput?.anchor ?? 'annotation',
			line,
			col: placementInput?.col ?? 'anchorEnd',
			preserveIndent: line === 'current' ? false : (placementInput?.preserveIndent ?? true),
		}

		// Based on the given `placement.anchor`, get the relevant ranges targeted by the annotation
		// to be used as anchors for positioning the rendered content
		let placementAnchors: Array<TransformTarget | undefined> = []
		switch (placement.anchor) {
			case 'annotation':
				// If the content should be rendered at the location of the annotation itself,
				// use `undefined`, which will use the annotation line in the downstream code
				placementAnchors = [undefined]
				break
			case 'firstTarget':
				placementAnchors = targets.length ? [targets[0]] : []
				break
			case 'lastTarget':
				placementAnchors = targets.length ? [targets[targets.length - 1]] : []
				break
			case 'allTargets':
				placementAnchors = targets
				break
		}
		if (!placementAnchors.length) return

		// Now go through all placement anchors and determine the final line and column
		// for the rendered content
		placementAnchors.forEach((anchor) => {
			const referenceLine = anchor?.line ?? annotationLine
			const referenceLineLength = referenceLine.text.length

			// Determine the inline range that powers placement classes and CSS variables -
			// by default, this is the placement anchor's inline range,
			// or the full line in case of an undefined anchor or range
			let anchorStart = anchor?.inlineRange?.columnStart ?? 0
			let anchorEnd = anchor?.inlineRange?.columnEnd ?? referenceLineLength

			// If the placement anchor is supposed to be the annotation itself, we visually align
			// the rendered content to the annotation comment including its content:
			// - anchorStart is set to the start column of the annotation comment
			// - anchorEnd is set to the length of the longest annotation content line
			if (placement.anchor === 'annotation') {
				// Resolve start from the parent comment's outer range:
				// start at its column (or 0), then move to the first non-whitespace character
				const commentStartLine = context.codeBlock.getLine(annotationComment.commentRange.start.line)
				const commentStartLineText = commentStartLine?.text ?? referenceLine.text
				const commentStartColumn = annotationComment.commentRange.start.column ?? 0
				const nonWhitespaceOffset = commentStartLineText.slice(commentStartColumn).search(/\S/)
				anchorStart = nonWhitespaceOffset >= 0 ? commentStartColumn + nonWhitespaceOffset : commentStartColumn

				// Extend the end to the longest non-whitespace content of the annotation comment
				anchorEnd = anchorStart
				for (let lineIndex = annotationComment.annotationRange.start.line; lineIndex <= annotationComment.annotationRange.end.line; lineIndex++) {
					const lineText = context.codeBlock.getLine(lineIndex)?.text
					if (lineText === undefined) continue

					// On the final annotation line, only consider text up to annotationRange.end.column
					// to ignore any code that appears after an inline closing comment
					const lineEndLimit = lineIndex === annotationComment.annotationRange.end.line ? (annotationComment.annotationRange.end.column ?? lineText.length) : lineText.length

					const contentLength = lineText.slice(0, lineEndLimit).trimEnd().length
					if (contentLength > anchorEnd) anchorEnd = contentLength
				}
			}

			// Resolve the final placement column for the rendered content node
			const contentRenderColumn =
				placement.col === 'anchorStart' ? anchorStart : placement.col === 'anchorEnd' ? anchorEnd : placement.col === 'lineStart' ? 0 : referenceLineLength

			renderPlacements.push({
				placement,
				annotationTarget: anchor,
				contentRenderLine: referenceLine,
				contentRenderColumn,
				anchorStart,
				anchorEnd,
			})
		})
	})
	return renderPlacements
}

/**
 * Renders raw annotation content using the configured renderer mode or renderer hook.
 */
async function renderContentNodes(options: { context: AnnotationCommentContentRenderContext; renderer: AnnotationCommentContentRenderer | undefined }): Promise<ElementContent[]> {
	const { context, renderer } = options
	const { placement } = context
	const sourceText = placement.line === 'current' ? context.content.lines.join(' ') : context.content.text
	if (!sourceText.trim()) return []

	if (typeof renderer === 'function') {
		// Run `content.render.contentRenderer` hook (if any)
		return (await renderer(context)) ?? []
	}

	if (renderer === 'inline-markdown') {
		return fromInlineMarkdown(sourceText)
	}

	return [{ type: 'text', value: sourceText } satisfies ElementContent]
}

/**
 * Builds the default placement wrapper element with class names and CSS anchor variables.
 */
function renderContentWrapperElement(options: { placement: AnnotationCommentContentRenderPlacement; anchorStart: number; anchorEnd: number; contentRenderColumn: number }) {
	const { placement, anchorStart, anchorEnd, contentRenderColumn } = options
	const lineClass = placement.line === 'before' ? 'line-before' : placement.line === 'after' ? 'line-after' : 'inline'
	const columnClass = placement.col === 'anchorStart' ? 'anchor-start' : placement.col === 'anchorEnd' ? 'anchor-end' : placement.col === 'lineStart' ? 'start' : 'end'
	const tagName = placement.line === 'current' ? 'span' : 'div'
	const element = h(tagName, { className: ['ac-content', lineClass, columnClass] })
	setInlineStyle(element, '--ecAnchorStart', `${anchorStart}`)
	setInlineStyle(element, '--ecAnchorEnd', `${anchorEnd}`)
	setInlineStyle(element, '--ecContentCol', `${contentRenderColumn}`)
	return element
}
