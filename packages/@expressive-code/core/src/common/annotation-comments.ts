import type { AnnotationComment } from 'annotation-comments'
import type { ExpressiveCodeBlock } from './block'

export type AnnotationCommentHandler = {
	/**
	 * The annotation tag names that this handler should process.
	 *
	 * By default, tag names must be unique across all annotation comment handlers,
	 * and attempting to register a handler for an existing tag name will throw an error.
	 * To change this, set the `overrideExisting` property to `true`.
	 */
	tagNames: string[]
	/**
	 * Whether to allow overriding existing tag names with this handler.
	 *
	 * @default false
	 */
	overrideExisting?: boolean | undefined
	/**
	 * Defines how to render any contents following the annotation tag.
	 *
	 * If this is not set, annotation contents are removed from the code and not rendered.
	 */
	contents?: (ContentOptions & WrapWith & CopyBehavior) | undefined
	/**
	 * Allows defining actions to perform on inline targets of annotation comments in the code
	 * (e.g. search term or regular expression matches, but not full lines).
	 *
	 * For example, the annotation comment `// [!highlight:search-term:3]` targets up to 3 matches
	 * of `search-term` in the code, and an annotation comment handler for the tag name `highlight`
	 * would perform the actions defined in this property on the targets.
	 */
	inlineTargets?: (WrapWith & CopyBehavior) | undefined
	/**
	 * Allows defining actions to perform on full-line targets of annotation comments in the code.
	 *
	 * For example, the annotation comment `// [!highlight:3]` targets up to 3 lines of code,
	 * and an annotation comment handler for the tag name `highlight` would perform the actions
	 * defined in this property on the target lines.
	 */
	fullLineTargets?: (AddClasses & CopyBehavior) | undefined
	/**
	 * Allows defining actions to perform on the parent code block when an annotation comment
	 * using one of the tag names registered by this handler is encountered.
	 */
	codeBlock: AddClasses | undefined
	custom: (context: AnnotationCommentHandlerContext) => void
}

export type AnnotationCommentHandlerContext = {
	codeBlock: ExpressiveCodeBlock
	annotationComment: AnnotationComment
}

export type ContentOptions = {
	/**
	 * How to output any contents following the annotation tag.
	 *
	 * The default behavior is to remove the entire annotation (tag & contents) from the code
	 * and not include it in the rendered output. To change this and render the contents,
	 * set this option to a value other than `none`.
	 *
	 * Available values:
	 * - `none` (default): Annotation contents are removed from the code and not rendered.
	 * - `inlineAtAnnotation`: Annotation contents are rendered in the line and column
	 *   where the annotation is located.
	 * - `inlineAtEndOfTargetLine`: Annotation contents are rendered at the end of the line
	 *   where the annotation is located.
	 * - `betweenLinesAtAnnotation`: The code lines are split at the annotation line,
	 *   and the contents are rendered between the two parts.
	 * - `betweenLinesAboveTarget`: The code lines are split above the first target,
	 *   and the contents are rendered between the two parts.
	 * - `betweenLinesBelowTarget`: The code lines are split below the last target,
	 *   and the contents are rendered between the two parts.
	 *
	 * To further influence how the contents are rendered, see the options
	 * `renderAs`, `addInlineStyle` and `wrapWith`.
	 */
	output: 'none' | 'inlineAtAnnotation' | 'inlineAtEndOfTargetLine' | 'betweenLinesAtAnnotation' | 'betweenLinesAboveTarget' | 'betweenLinesBelowTarget'
	/**
	 * Available renderers:
	 * - `inline-markdown` (default): The contents are rendered with limited support for inline
	 *   Markdown formatting.
	 *   - The following Markdown features are supported:
	 *     - `*italic*`, `**bold**`, including combinations like `***bold** & italic*`
	 *   - When `output` is set to an `inline` option, contents are rendered as a single line,
	 *     with support for basic inline Markdown formatting and links.
	 *   - When `output` is set to a `betweenLines` option, contents are rendered as a Markdown
	 *     document, with support for headings, lists, code blocks, and more.
	 * - `plaintext`: The contents are rendered as-is, without any special formatting applied.
	 *   - Single line breaks are collapsed to a single space.
	 *   - When `output` is set to a `betweenLines` option, empty lines start a new paragraph.
	 */
	renderAs: 'inline-markdown' | 'plaintext'
}

export type CopyBehavior = {
	stripFromCode?: boolean | undefined
}

export type WrapWith = {
	wrapWith?: string | undefined
}

export type AddClasses = {
	addClasses?: string[] | undefined
}
