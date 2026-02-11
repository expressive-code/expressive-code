import type { AnnotationComment } from 'annotation-comments'
import type { Element, ElementContent, Parents } from '../../../hast'
import type { AnnotationBaseOptions, AnnotationRenderOptions } from '../../../common/annotation'
import type {
	AnnotationCommentContentRenderPlacement,
	AnnotationCommentContentRenderPlacementInput,
	AnnotationCommentContentRenderer,
	AnnotationCommentContentWrapperFn,
	AnnotationCommentContentParentLineFn,
	AnnotationCommentHandler,
} from '../../../common/annotation-comments'
import type { ExpressiveCodeLogger } from '../../../common/logger'
import type { TransformTarget } from '../../../common/transforms'
import { fromInlineMarkdown, getClassNames, h, setInlineStyle } from '../../../hast'
import { ExpressiveCodeAnnotation } from '../../../common/annotation'
import { getLeadingWhitespaceColumns } from '../../indentation'
import { isHastElement } from '../../type-checks'
import { getDefaultInsertOnDeleteLine } from './target-resolving'
import type { AnnotationCommentContextBase } from './types'

type ResolvedContentRenderPlacement = {
	placement: AnnotationCommentContentRenderPlacement
	target: TransformTarget
	anchorStart: number
	anchorEnd: number
	contentColumn: number
}

class AnnotationCommentContentAnnotation extends ExpressiveCodeAnnotation {
	name = 'Annotation comment rendered content'
	readonly contentWrapperTemplate: Element
	readonly insertAtStart: boolean
	readonly parentLine: ((options: { lineAst: Element; contentWrapper: Element }) => Element | undefined) | undefined

	constructor(
		options: {
			contentWrapperTemplate: Element
			insertAtStart: boolean
			parentLine?: ((options: { lineAst: Element; contentWrapper: Element }) => Element | undefined) | undefined
		} & AnnotationBaseOptions
	) {
		super(options)
		this.contentWrapperTemplate = options.contentWrapperTemplate
		this.insertAtStart = options.insertAtStart
		this.parentLine = options.parentLine
	}

	render({ nodesToTransform }: AnnotationRenderOptions): Parents[] {
		return nodesToTransform.map((node) => {
			if (node.type !== 'element') return node

			const rootLineNode = node
			const contentElement = cloneContentNode(this.contentWrapperTemplate)

			const codeContainer = rootLineNode.children.find((child) => child.type === 'element' && getClassNames(child).includes('code'))
			if (codeContainer?.type === 'element') {
				if (this.insertAtStart) {
					codeContainer.children.unshift(contentElement)
				} else {
					codeContainer.children.push(contentElement)
				}
			} else {
				rootLineNode.children.push(contentElement)
			}
			return (
				this.parentLine?.({
					lineAst: rootLineNode,
					contentWrapper: contentElement,
				}) ?? rootLineNode
			)
		})
	}
}

function cloneContentNode<NodeType>(node: NodeType): NodeType {
	if (typeof structuredClone === 'function') return structuredClone(node)
	return JSON.parse(JSON.stringify(node)) as NodeType
}

/**
 * Applies optional `content.render` convenience behavior for annotation comment handlers.
 *
 * It resolves render placements, renders content, and injects the result either inline
 * or via generated lines depending on the resolved placement.
 */
export async function applyContentRenderConvenience(options: {
	handler: AnnotationCommentHandler
	pluginName: string
	context: AnnotationCommentContextBase
	logger: ExpressiveCodeLogger
}) {
	const { handler, pluginName, context, logger } = options
	const renderOptions = handler.content?.render
	if (!renderOptions) return
	if (!context.content.lines.length) return

	try {
		const renderPlacements = await resolveContentRenderPlacements({
			context,
			placementOption: renderOptions.placement,
		})
		if (!renderPlacements.length) return

		for (const renderPlacement of renderPlacements) {
			const renderedContent = await resolveRenderedContentNodes({
				context,
				placement: renderPlacement.placement,
				target: renderPlacement.target,
				renderer: renderOptions.contentRenderer,
			})
			let contentWrapperTemplate = createRenderedContentElement({
				placement: renderPlacement.placement,
				anchorStart: renderPlacement.anchorStart,
				anchorEnd: renderPlacement.anchorEnd,
				contentColumn: renderPlacement.contentColumn,
			})
			if (renderedContent.length) {
				contentWrapperTemplate.children.push(...renderedContent)
			}
			contentWrapperTemplate = await resolveContentWrapper({
				context,
				placement: renderPlacement.placement,
				target: renderPlacement.target,
				renderedContent,
				contentWrapper: contentWrapperTemplate,
				contentWrapperTransform: renderOptions.contentWrapper,
			})

			if (renderPlacement.placement.line !== 'current') {
				renderPlacement.target.line.addRenderTransform({
					type: 'insert',
					position: renderPlacement.placement.line === 'before' ? 'before' : 'after',
					onDeleteLine: getDefaultInsertOnDeleteLine(context.annotationComment),
					render: ({ renderEmptyLine }) => {
						const emptyLine = renderEmptyLine()
						if (shouldPreserveIndent(renderPlacement.placement)) {
							const indent = getLineIndentColumns(renderPlacement.target)
							if (indent > 0) setInlineStyle(emptyLine.lineAst, '--ecIndent', `${indent}ch`)
						}
						const contentWrapper = cloneContentNode(contentWrapperTemplate)
						emptyLine.codeWrapper.children.push(contentWrapper)
						return applyParentLine(renderOptions.parentLine, {
							...context,
							placement: renderPlacement.placement,
							target: renderPlacement.target,
							contentWrapper,
							lineAst: emptyLine.lineAst,
							isGeneratedLine: true,
						})
					},
				})
				continue
			}

			renderPlacement.target.line.addAnnotation(
				new AnnotationCommentContentAnnotation({
					contentWrapperTemplate,
					insertAtStart: renderPlacement.contentColumn === 0,
					parentLine: ({ lineAst, contentWrapper }) =>
						applyParentLine(renderOptions.parentLine, {
							...context,
							placement: renderPlacement.placement,
							target: renderPlacement.target,
							contentWrapper,
							lineAst,
							isGeneratedLine: false,
						}),
					renderPhase: 'latest',
				})
			)
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		logger.warn(`Annotation comments: Failed to render content convenience for plugin "${pluginName}" and tag "${context.annotationComment.tag.name}": ${message}`)
	}
}

function applyParentLine(
	parentLine: AnnotationCommentContentParentLineFn | undefined,
	context: AnnotationCommentContextBase & {
		placement: AnnotationCommentContentRenderPlacement
		target: TransformTarget
		contentWrapper: Element
		lineAst: Element
		isGeneratedLine: boolean
	}
) {
	return parentLine?.(context) ?? context.lineAst
}

async function resolveContentRenderPlacements(options: {
	context: AnnotationCommentContextBase
	placementOption: NonNullable<NonNullable<AnnotationCommentHandler['content']>['render']>['placement']
}): Promise<ResolvedContentRenderPlacement[]> {
	const { context, placementOption } = options
	const placements = await resolveContentPlacementOptions(placementOption, context)
	if (!placements.length) return []
	const normalizedPlacements = placements.map((placement) => normalizeContentPlacement(placement))

	const renderPlacements: ResolvedContentRenderPlacement[] = []
	normalizedPlacements.forEach((placement) => {
		resolveContentPlacementTargets({ context, placement }).forEach((target) => {
			const { anchorStart, anchorEnd } = resolvePlacementAnchorColumns({
				annotationComment: context.annotationComment,
				placement,
				target,
			})
			const contentColumn = resolveContentColumn({
				placement,
				target,
				anchorStart,
				anchorEnd,
			})
			renderPlacements.push({
				placement,
				target,
				anchorStart,
				anchorEnd,
				contentColumn,
			})
		})
	})
	return renderPlacements
}

async function resolveContentPlacementOptions(
	placementOption: NonNullable<NonNullable<AnnotationCommentHandler['content']>['render']>['placement'],
	context: AnnotationCommentContextBase
) {
	if (placementOption === undefined) {
		return [undefined]
	}
	if (typeof placementOption === 'function') {
		const resolved = await placementOption(context)
		if (!resolved) return []
		return (Array.isArray(resolved) ? resolved : [resolved]).filter((placement): placement is AnnotationCommentContentRenderPlacementInput => !!placement)
	}
	return (Array.isArray(placementOption) ? placementOption : [placementOption]).filter((placement): placement is AnnotationCommentContentRenderPlacementInput => !!placement)
}

function normalizeContentPlacement(placement: AnnotationCommentContentRenderPlacementInput | undefined) {
	const line = placement?.line ?? 'current'
	return {
		anchor: placement?.anchor ?? 'annotation',
		line,
		col: placement?.col ?? 'anchorEnd',
		preserveIndent: line === 'current' ? false : (placement?.preserveIndent ?? true),
	} satisfies AnnotationCommentContentRenderPlacement
}

function resolveContentPlacementTargets(options: { context: AnnotationCommentContextBase; placement: AnnotationCommentContentRenderPlacement }): TransformTarget[] {
	const { context, placement } = options
	const { annotationComment, targets, codeBlock } = context
	const annotationLineIndex = annotationComment.commentRange.start.line
	const annotationLine = codeBlock.getLine(annotationLineIndex)
	let annotationTarget: TransformTarget | undefined
	if (annotationLine) {
		annotationTarget = {
			line: annotationLine,
			lineIndex: annotationLineIndex,
		}
	}

	if (placement.anchor === 'annotation') return annotationTarget ? [annotationTarget] : []
	if (placement.anchor === 'firstTarget') return targets.length ? [targets[0]] : []
	if (placement.anchor === 'lastTarget') return targets.length ? [targets[targets.length - 1]] : []
	return targets
}

function resolvePlacementAnchorColumns(options: { annotationComment: AnnotationComment; placement: AnnotationCommentContentRenderPlacement; target: TransformTarget }) {
	const { annotationComment, placement, target } = options
	if (placement.anchor !== 'annotation') return getTargetAnchorColumns(target)
	return getAnnotationAnchorColumns({
		annotationComment,
		target,
	})
}

function resolveContentColumn(options: { placement: AnnotationCommentContentRenderPlacement; target: TransformTarget; anchorStart: number; anchorEnd: number }) {
	const { placement, target, anchorStart, anchorEnd } = options
	if (placement.col === 'anchorStart') return anchorStart
	if (placement.col === 'anchorEnd') return anchorEnd
	if (placement.col === 'lineStart') return 0
	return target.line.text.length
}

function shouldPreserveIndent(placement: AnnotationCommentContentRenderPlacement) {
	if (placement.line === 'current') return false
	return placement.preserveIndent ?? true
}

function getLineIndentColumns(target: TransformTarget) {
	return getLeadingWhitespaceColumns(target.line.text)
}

function getTargetAnchorColumns(target: TransformTarget) {
	if (target.inlineRange) {
		return {
			anchorStart: target.inlineRange.columnStart,
			anchorEnd: target.inlineRange.columnEnd,
		}
	}
	return {
		anchorStart: 0,
		anchorEnd: target.line.text.length,
	}
}

function getAnnotationAnchorColumns(options: { annotationComment: AnnotationComment; target: TransformTarget }) {
	const { annotationComment, target } = options
	const lineLength = target.line.text.length
	const anchorStart = clamp(resolveAnnotationAnchorStartColumn(annotationComment, target), 0, lineLength)
	const anchorEnd = clamp(resolveAnnotationAnchorEndColumn(annotationComment, target, lineLength), anchorStart, lineLength)
	return {
		anchorStart,
		anchorEnd,
	}
}

function resolveAnnotationAnchorStartColumn(annotationComment: AnnotationComment, target: TransformTarget) {
	const rangeStartColumn = annotationComment.commentRange.start.column ?? annotationComment.annotationRange.start.column
	if (rangeStartColumn !== undefined) return rangeStartColumn

	// Some parser ranges are line-only without column details
	// In that case, resolve the start column from the comment opening on the anchor line
	const searchEndColumn = annotationComment.commentInnerRange.start.column ?? annotationComment.tag.range.start.column ?? target.line.text.length
	const searchArea = target.line.text.slice(0, clamp(searchEndColumn, 0, target.line.text.length))
	const openingColumn = searchArea.lastIndexOf(annotationComment.commentSyntax.opening)
	if (openingColumn >= 0) return openingColumn

	return annotationComment.tag.range.start.column ?? 0
}

function resolveAnnotationAnchorEndColumn(annotationComment: AnnotationComment, target: TransformTarget, lineLength: number) {
	if (annotationComment.commentRange.end.line === target.lineIndex) {
		const commentEndColumn = annotationComment.commentRange.end.column
		if (commentEndColumn !== undefined) return commentEndColumn
	}
	if (annotationComment.annotationRange.end.line === target.lineIndex) {
		const annotationEndColumn = annotationComment.annotationRange.end.column
		if (annotationEndColumn !== undefined) return annotationEndColumn
	}
	if (annotationComment.tag.range.end.line === target.lineIndex) {
		const tagEndColumn = annotationComment.tag.range.end.column
		if (tagEndColumn !== undefined) return tagEndColumn
	}
	return lineLength
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value))
}

async function resolveRenderedContentNodes(options: {
	context: AnnotationCommentContextBase
	placement: AnnotationCommentContentRenderPlacement
	target: TransformTarget
	renderer: AnnotationCommentContentRenderer | undefined
}): Promise<ElementContent[]> {
	const { context, placement, target, renderer } = options
	const sourceText = placement.line === 'current' ? context.content.lines.join(' ') : context.content.text
	if (!sourceText.trim()) return []

	if (typeof renderer === 'function') {
		const rendererContext = { ...context, placement, target }
		return (await renderer(rendererContext)) ?? []
	}

	if (renderer === 'inline-markdown') {
		return fromInlineMarkdown(sourceText)
	}

	return [{ type: 'text', value: sourceText } satisfies ElementContent]
}

async function resolveContentWrapper(options: {
	context: AnnotationCommentContextBase
	placement: AnnotationCommentContentRenderPlacement
	target: TransformTarget
	renderedContent: ElementContent[]
	contentWrapper: Element
	contentWrapperTransform: AnnotationCommentContentWrapperFn | undefined
}) {
	const { context, placement, target, renderedContent, contentWrapper, contentWrapperTransform } = options
	if (!contentWrapperTransform) return contentWrapper

	const transformedWrapper = await contentWrapperTransform({
		...context,
		placement,
		target,
		renderedContent,
		contentWrapper,
	})
	if (transformedWrapper === undefined) return contentWrapper
	if (!isHastElement(transformedWrapper)) {
		throw new Error('content.render.contentWrapper must return a valid HAST element')
	}
	return transformedWrapper
}

function createRenderedContentElement(options: { placement: AnnotationCommentContentRenderPlacement; anchorStart: number; anchorEnd: number; contentColumn: number }) {
	const { placement, anchorStart, anchorEnd, contentColumn } = options
	const lineClass = getPlacementLineClassName(placement.line)
	const columnClass = getPlacementColumnClassName(placement.col)
	const tagName = placement.line === 'current' ? 'span' : 'div'
	const element = h(tagName, { className: ['ac-content', lineClass, columnClass] })
	setInlineStyle(element, '--ecAnchorStart', `${anchorStart}`)
	setInlineStyle(element, '--ecAnchorEnd', `${anchorEnd}`)
	setInlineStyle(element, '--ecContentCol', `${contentColumn}`)
	return element
}

function getPlacementLineClassName(line: AnnotationCommentContentRenderPlacement['line']) {
	if (line === 'before') return 'line-before'
	if (line === 'after') return 'line-after'
	return 'inline'
}

function getPlacementColumnClassName(col: AnnotationCommentContentRenderPlacement['col']) {
	if (col === 'anchorStart') return 'anchor-start'
	if (col === 'anchorEnd') return 'anchor-end'
	if (col === 'lineStart') return 'start'
	return 'end'
}
