import type { AnnotationComment } from 'annotation-comments'
import type { AnnotationBaseOptions, AnnotationRenderOptions, ExpressiveCodeInlineRange } from './annotation'
import type { ExpressiveCodeBlock } from './block'
import type { ExpressiveCodeLine } from './line'
import { ExpressiveCodeAnnotation } from './annotation'
import { addClassNames, getClassNames, h } from '../hast'

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
	 */
	commentContents?: (ContentOptions & WrapWith & CopyBehavior) | undefined
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
	 * Allows defining actions to perform on the full parent lines containing at least
	 * one inline target of annotations registered by this handler.
	 *
	 * This allows applying special classes to lines containing a search term match, for example.
	 */
	inlineTargetParentLines?: (AddClasses & CopyBehavior) | undefined
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
	parentBlock?: AddClasses | undefined
	/**
	 * Allows providing a custom handler function that is called when an annotation comment
	 * using one of the tag names registered by this handler is encountered.
	 *
	 * The handler will run after all other actions have been performed, and it can be used
	 * to perform additional custom actions on the code block or annotation comment.
	 */
	custom?: ((context: AnnotationCommentHandlerContext) => void | Promise<void>) | undefined
}

export type AnnotationCommentHandlerContext = {
	codeBlock: ExpressiveCodeBlock
	annotationComment: AnnotationComment
}

export type AnnotationCommentInlineTargetContext = AnnotationCommentHandlerContext & {
	line: ExpressiveCodeLine
	inlineRange?: ExpressiveCodeInlineRange | undefined
}

export type WrapWithAnnotationFn = (context: AnnotationCommentInlineTargetContext) => ExpressiveCodeAnnotation | Promise<ExpressiveCodeAnnotation>

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

export type AddClasses = {
	/**
	 * CSS class name(s) that should be added to the elements targeted by the action.
	 */
	addClasses?: string | string[] | undefined
}

export type CopyBehavior = {
	/**
	 * Whether to remove the parts targeted by the current {@link AnnotationCommentHandler} action
	 * from the code that can be copied to the clipboard.
	 *
	 * Defaults to `false` for `fullLineTargets` and `inlineTargets`, and `true` for `contents`.
	 * This keeps any targeted lines or search term matches in the code, but strips the entire
	 * annotation comment (tag, contents & comment syntax) from the copied text.
	 *
	 * An annotation that allows marking parts of the code as deleted could set this to `true`
	 * for `fullLineTargets` and `inlineTargets` to allow copying a version of the code where
	 * all marked parts have been removed.
	 *
	 * A custom note annotation could set `contents: { stripFromCode: false }` to prevent removing
	 * contents after the annotation tag from the copied code. The code will then still contain
	 * the comment syntax and the annotation contents, and only the tag will be removed.
	 */
	stripFromCode?: boolean | undefined
}

export type WrapWith = {
	/**
	 * Wraps the rendered contents in a HAST element or `ExpressiveCodeAnnotation`.
	 *
	 * If set to a string, it will be treated as a hastscript-compatible CSS selector and passed to
	 * hastscript's `h()` function to create the wrapping element. See the
	 * [hastscript docs](https://github.com/syntax-tree/hastscript/blob/main/readme.md#hselector-properties-children)
	 * for more information.
	 *
	 * If set to a function, it will be called for each content or inline target to wrap,
	 * and is expected to return an `ExpressiveCodeAnnotation` that takes care of rendering it.
	 */
	wrapWith?: string | WrapWithAnnotationFn | undefined
}

export class AddClassesAnnotation extends ExpressiveCodeAnnotation {
	name: string
	classes: string[]

	constructor({ classes, ...baseOptions }: { classes: string | string[] } & AnnotationBaseOptions) {
		super(baseOptions)
		this.name = 'Add classes'
		this.classes = getClassNames(classes)
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => {
			if (node.type !== 'element') node = h('span', node)
			addClassNames(node, this.classes)
			return node
		})
	}
}

export class WrapWithAnnotation extends ExpressiveCodeAnnotation {
	name: string
	selector: string

	constructor({ selector, ...baseOptions }: { selector: string } & AnnotationBaseOptions) {
		super(baseOptions)
		this.name = 'Wrap with'
		this.selector = selector
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => h(this.selector, node))
	}
}
