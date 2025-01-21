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
	 * Defines how to preprocess the annotation tag (e.g. `[!note]`) inside the annotation comment.
	 *
	 * By default, the tag is replaced with an empty string, removing it from the code
	 * that can be copied to the clipboard.
	 *
	 * For some annotations, it might be useful to change this to a human-readable prefix text
	 * to ensure the meaning of the annotation is clear even without the tag itself
	 * (e.g. `[!error]` -> `Error:`).
	 */
	commentTag?: PreprocessingOptions | undefined
	/**
	 * Defines how to preprocess and render any contents following the annotation tag
	 * (e.g. `[!note] These are the contents`) inside the annotation comment.
	 *
	 * By default, they are kept in the code that can be copied to the clipboard, but not rendered.
	 *
	 * To render the contents, set the `renderLocation` option to a value other than `none`.
	 * You can then further customize the output, e.g. by setting the `wrapWith` option
	 * to wrap the contents in a new HAST element that can be styled with CSS.
	 */
	commentContents?: (PreprocessingOptions & ContentRenderOptions & WrapWith) | undefined
	/**
	 * Allows defining actions to perform on inline targets of annotation comments in the code
	 * (e.g. search term or regular expression matches, but not full lines).
	 *
	 * For example, the annotation comment `// [!highlight:search-term:3]` targets up to 3 matches
	 * of `search-term` in the code, and an annotation comment handler for the tag name `highlight`
	 * would perform the actions defined in this property on the targets.
	 */
	inlineTargets?: (WrapWith & CopyOptions) | undefined
	/**
	 * Allows defining actions to perform on the full parent lines containing at least
	 * one inline target of annotations registered by this handler.
	 *
	 * This allows applying special classes to lines containing a search term match, for example.
	 */
	inlineTargetParentLines?: (AddClasses & CopyOptions) | undefined
	/**
	 * Allows defining actions to perform on full-line targets of annotation comments in the code.
	 *
	 * For example, the annotation comment `// [!highlight:3]` targets up to 3 lines of code,
	 * and an annotation comment handler for the tag name `highlight` would perform the actions
	 * defined in this property on the target lines.
	 */
	fullLineTargets?: (AddClasses & CopyOptions) | undefined
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

export type AnnotationCommentCodeContext = AnnotationCommentHandlerContext & {
	line: ExpressiveCodeLine
	inlineRange?: ExpressiveCodeInlineRange | undefined
}

export type ReplaceCodeFn = (context: AnnotationCommentCodeContext) => string | Promise<string>
export type WrapWithAnnotationFn = (context: AnnotationCommentCodeContext) => ExpressiveCodeAnnotation | Promise<ExpressiveCodeAnnotation>

export type PreprocessingOptions = {
	replaceCode?: string | ReplaceCodeFn | undefined
}

export type ContentRenderOptions = {
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
	renderLocation: 'none' | 'inlineAtAnnotation' | 'inlineAtEndOfTargetLine' | 'betweenLinesAtAnnotation' | 'betweenLinesAboveTarget' | 'betweenLinesBelowTarget'
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

export type CopyOptions = {
	/**
	 * Allows modifying the targeted code when creating the plaintext version that can be copied
	 * to the clipboard.
	 *
	 * For example, a handler for deleted lines could use this to create a commented out version
	 * of the targeted lines. Without this, the deletions would not be recognizable in the
	 * copied code, as its plaintext format cannot contain the formatting of rendered annotations.
	 */
	replaceCodeForCopying?: ReplaceCodeFn | undefined
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
