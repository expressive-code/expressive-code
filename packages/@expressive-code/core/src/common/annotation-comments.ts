import type { AnnotationComment } from 'annotation-comments'
import type { Element, ElementContent } from '../hast'
import type { ExpressiveCodeLine } from './line'
import type { ExpressiveCodeHookContextBase } from './plugin-hooks'
import type { RenderTransform } from './render-transforms'
import type { TransformTarget } from './transforms'
import type { Awaitable, MaybeArray, MaybeGetter } from '../helpers/types'

export type AnnotationCommentHandler = {
	/**
	 * The annotation tag names that this handler should process.
	 *
	 * By default, tag names must be unique across all annotation comment handlers,
	 * and attempting to register a handler for an existing tag name logs a warning
	 * and keeps the first registered handler.
	 * To change this, set `overrideExisting` to `true`.
	 */
	tagNames: string[]
	/**
	 * Whether to allow overriding existing tag names with this handler.
	 *
	 * @default false
	 */
	overrideExisting?: boolean | undefined
	/**
	 * Optional defaults for processing annotation content that follows the tag.
	 */
	content?: AnnotationCommentContentOptions | undefined
	/**
	 * Maps the current annotation comment to 0-n render annotations and copy transforms.
	 */
	handle: AnnotationCommentHandlerFn
}

export type AnnotationCommentHandlerFn = (context: AnnotationCommentHandlerContext) => Awaitable<void>

export type AnnotationCommentHandlerContext = AnnotationCommentContentContext & {
	/**
	 * The code line containing the annotation comment.
	 *
	 * This is useful for standalone annotations (e.g. `:0`) that do not resolve
	 * any code targets, but still need an anchor line for render transforms.
	 */
	annotationLine: ExpressiveCodeLine
	addRenderTransform: (transform: RenderTransform) => void
}

export type AnnotationCommentContentOptions = {
	/**
	 * Controls whether annotation content should stay in copied code plaintext.
	 *
	 * @default 'keep'
	 */
	copyCode?: MaybeGetter<AnnotationCommentContentCleanup, AnnotationCommentContentContext> | undefined
	/**
	 * Controls whether annotation content should stay in display code plaintext
	 * after tag cleanup.
	 *
	 * @default 'keep'
	 */
	displayCode?: MaybeGetter<AnnotationCommentContentCleanup, AnnotationCommentContentContext> | undefined
	/**
	 * Optional convenience rendering for comment content.
	 *
	 * If set, the engine can render this content at the configured placement by creating
	 * internal annotations. Advanced handlers can skip this and create annotations manually
	 * in `handle` instead.
	 */
	render?: AnnotationCommentContentRenderOptions | undefined
}

export type AnnotationCommentContentCleanup = 'keep' | 'remove'

export type AnnotationCommentContentRenderOptions = {
	/**
	 * Defines where to render content.
	 *
	 * You can pass:
	 * - a single placement object
	 * - multiple placement objects
	 * - a resolver function that returns one or more placement objects
	 *
	 * Placement defaults:
	 * - `anchor: 'annotation'`
	 * - `line: 'current'`
	 * - `col: 'anchorEnd'`
	 * - `preserveIndent: true` for generated lines (`line: 'before' | 'after'`)
	 *
	 * Returning `undefined` uses the default placement.
	 * Returning an empty array skips rendering for the current annotation comment.
	 */
	placement?: MaybeGetter<MaybeArray<AnnotationCommentContentRenderPlacementInput>, AnnotationCommentContentContext> | undefined
	/**
	 * Converts annotation comment content to rendered HAST nodes.
	 *
	 * - `plaintext`: Renders content as plain text
	 * - `inline-markdown`: Renders content with inline markdown support
	 * - custom function: Returns custom HAST nodes
	 *
	 * The returned nodes are inserted into the default content wrapper before
	 * `contentWrapper` runs.
	 *
	 * @default 'plaintext'
	 */
	contentRenderer?: AnnotationCommentContentRenderer | undefined
	/**
	 * Allows modifying or replacing the generated wrapper around rendered content.
	 *
	 * The callback runs after placement resolution and content rendering.
	 * It receives:
	 * - `renderedContent`: the rendered content nodes
	 * - `contentWrapper`: the prebuilt wrapper element containing `renderedContent`
	 *
	 * Return behavior:
	 * - return `undefined`: keep `contentWrapper` (mutations are applied)
	 * - return an element: replace `contentWrapper` with the returned element
	 */
	contentWrapper?: AnnotationCommentContentWrapperFn | undefined
	/**
	 * Allows modifying or replacing the rendered host line that contains the content wrapper.
	 *
	 * This runs after `contentWrapper` for both existing code lines (`line: 'current'`)
	 * and generated lines (`line: 'before' | 'after'`).
	 *
	 * Return behavior:
	 * - return `undefined`: keep `lineAst` (mutations are applied)
	 * - return an element: replace `lineAst` with the returned element
	 */
	parentLine?: AnnotationCommentContentParentLineFn | undefined
}

export type AnnotationCommentContentRenderPlacement = {
	/**
	 * Which line target should be used as the placement anchor.
	 *
	 * - `annotation`: the line containing the annotation comment
	 * - `firstTarget`: the first resolved target line or inline match
	 * - `lastTarget`: the last resolved target line or inline match
	 * - `allTargets`: render once for each resolved target
	 */
	anchor: 'annotation' | 'firstTarget' | 'lastTarget' | 'allTargets'
	/**
	 * Which host line should contain the rendered content.
	 *
	 * - `current`: render inside the anchor line
	 * - `before`: render in a generated empty line above the anchor line
	 * - `after`: render in a generated empty line below the anchor line
	 */
	line: 'current' | 'before' | 'after'
	/**
	 * Which column reference to use for anchor/content positioning variables.
	 *
	 * - `anchorStart`: start of the anchor range
	 * - `anchorEnd`: end of the anchor range
	 * - `lineStart`: column 0 of the anchor line
	 * - `lineEnd`: end column of the anchor line
	 */
	col: 'anchorStart' | 'anchorEnd' | 'lineStart' | 'lineEnd'
	/**
	 * Whether generated lines should preserve indentation from the anchor line.
	 *
	 * This only applies when `line` is `before` or `after`.
	 *
	 * @default true for generated lines
	 */
	preserveIndent?: boolean | undefined
}

export type AnnotationCommentContentRenderPlacementInput = Partial<AnnotationCommentContentRenderPlacement>

export type AnnotationCommentContentPlacementContext = {
	placement: AnnotationCommentContentRenderPlacement
	/**
	 * The resolved target that this placement is associated with.
	 *
	 * This is `undefined` for placements anchored to the annotation itself.
	 */
	annotationTarget: TransformTarget | undefined
	/**
	 * The code line used to host the rendered content for this placement.
	 */
	contentRenderLine: ExpressiveCodeLine
	/**
	 * The resolved render column used for this placement on `contentRenderLine`.
	 */
	contentRenderColumn: number
}

export type AnnotationCommentContentRenderContext = AnnotationCommentContentContext & AnnotationCommentContentPlacementContext

export type AnnotationCommentContentWrapperBaseContext = AnnotationCommentContentRenderContext & {
	contentWrapper: Element
}

export type AnnotationCommentContentWrapperContext = AnnotationCommentContentWrapperBaseContext & {
	renderedContent: ElementContent[]
}

export type AnnotationCommentContentParentLineContext = AnnotationCommentContentWrapperBaseContext & {
	lineAst: Element
	isGeneratedLine: boolean
}

export type AnnotationCommentContentWrapperFn = (context: AnnotationCommentContentWrapperContext) => Awaitable<Element | void>

export type AnnotationCommentContentParentLineFn = (context: AnnotationCommentContentParentLineContext) => Element | void

export type AnnotationCommentContentRendererFn = (context: AnnotationCommentContentRenderContext) => Awaitable<ElementContent[]>

export type AnnotationCommentContentRenderer = 'plaintext' | 'inline-markdown' | AnnotationCommentContentRendererFn

export type AnnotationCommentContentContext = ExpressiveCodeHookContextBase & {
	annotationComment: AnnotationComment
	/**
	 * Resolved targets for the current annotation comment.
	 *
	 * Targets with an `inlineRange` represent inline ranges.
	 * Targets without an `inlineRange` represent full lines.
	 */
	targets: TransformTarget[]
	content: {
		lines: string[]
		text: string
	}
}
