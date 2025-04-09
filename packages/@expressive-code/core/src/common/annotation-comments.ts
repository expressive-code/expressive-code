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
	 * Defines how to handle annotation comment contents following the annotation tag
	 * (e.g. `[!note] These are the contents`).
	 *
	 * By default, these contents are kept in the code that can be copied to the clipboard,
	 * but not rendered.
	 *
	 * To render the contents, set the `renderLocation` option to a value other than `none`.
	 * You can then further customize the output, e.g. by setting the `wrapWith` option
	 * to wrap the contents in a new HAST element that can be styled with CSS.
	 */
	commentContents?: (CopyOptions<ReplaceCommentContentsFn> & RenderContents & WrapWith) | undefined
	/**
	 * Defines actions to perform on inline targets of annotation comments in the code
	 * (e.g. search term or regular expression matches, but not full lines).
	 *
	 * For example, the annotation comment `// [!highlight:"search term":3]` targets up to 3 matches
	 * of `search term` in the code, and setting `inlineTargets: { wrapWith: 'span.highlight' }`
	 * would wrap each match in a `span` element with the class `highlight`.
	 */
	inlineTargets?: (ProcessPlaintext & CopyOptions & WrapWith) | undefined
	/**
	 * Defines actions to perform on the full parent lines containing at least
	 * one inline target of annotations registered by this handler.
	 *
	 * This allows applying special classes to lines containing a search term match, for example.
	 */
	inlineTargetParentLines?: (ProcessPlaintext & CopyOptions & AddClasses & WrapWith) | undefined
	/**
	 * Defines actions to perform on full-line targets of annotation comments in the code.
	 *
	 * For example, the annotation comment `// [!highlight:3]` targets up to 3 lines of code,
	 * and this property defines the actions to be performed on these target lines.
	 */
	fullLineTargets?: (ProcessPlaintext & CopyOptions & AddClasses & WrapWith) | undefined
	/**
	 * Defines actions to perform on the parent code block when an annotation comment
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

export type AnnotationCommentCodeRange = {
	/**
	 * The line in the code block that contains the annotation comment.
	 */
	line: ExpressiveCodeLine
	/**
	 * The inline range within the line (if any) that is targeted by the annotation comment.
	 */
	inlineRange?: ExpressiveCodeInlineRange | undefined
}

export type ReplaceCodeFn = (context: AnnotationCommentHandlerContext & AnnotationCommentCodeRange) => string | Promise<string>
export type ReplaceCommentContentsFn = (context: AnnotationCommentHandlerContext) => string[] | Promise<string[]>
export type WrapWithAnnotationFn = (context: AnnotationCommentHandlerContext) => ExpressiveCodeAnnotation | Promise<ExpressiveCodeAnnotation>

export type AddClasses = {
	/**
	 * CSS class name(s) that should be added to the elements targeted by the action.
	 */
	addClasses?: string | string[] | undefined
}

export type RenderContents = {
	/**
	 * Where to render any contents following the annotation tag.
	 *
	 * Available values:
	 * - `none` (default): Contents are not rendered.
	 * - `inlineAtAnnotation`: Contents are rendered at the location of the annotation comment.
	 * - `inlineAtEndOfFirstTargetLine`: Contents are rendered at the end of the first target line.
	 * - `inlineAtEndOfAllTargetLines`: Contents are rendered at the end of all target lines.
	 * - `betweenLinesAtAnnotation`: The code lines are split at the annotation line,
	 *   and contents are rendered between the two parts.
	 * - `betweenLinesAboveTarget`: The code lines are split above the first target,
	 *   and contents are rendered between the two parts.
	 * - `betweenLinesBelowTarget`: The code lines are split below the last target,
	 *   and contents are rendered between the two parts.
	 *
	 * To further influence how the contents are rendered, see the options `renderAs` and `wrapWith`.
	 *
	 * Please note that rendering is independent from how contents are copied to the clipboard.
	 * You can control the copied code separately using the `replaceInCopiedCode` option.
	 */
	renderLocation:
		| 'none'
		| 'inlineAtAnnotation'
		| 'inlineAtEndOfFirstTargetLine'
		| 'inlineAtEndOfAllTargetLines'
		| 'betweenLinesAtAnnotation'
		| 'betweenLinesAboveTarget'
		| 'betweenLinesBelowTarget'
	/**
	 * How to parse and render the contents following the annotation tag.
	 *
	 * Available renderers:
	 * - `inline-markdown` (default): The contents are rendered with limited support for inline
	 *   Markdown formatting.
	 *   - The following Markdown features are supported:
	 *     - `*italic*`, `**bold**`, including combinations like `***bold** & italic*`
	 *   - When `renderLocation` is set to an `inline` option, contents are rendered
	 *     as a single line, with support for basic inline Markdown formatting and links.
	 *   - When `renderLocation` is set to a `betweenLines` option, contents are rendered
	 *     as a Markdown document, with support for headings, lists, code blocks, and more.
	 * - `plaintext`: The contents are rendered as-is, without any special formatting applied.
	 *   - Single line breaks are collapsed to a single space.
	 *   - When `renderLocation` is set to a `betweenLines` option,
	 *     empty lines start a new paragraph.
	 *
	 * Please ensure that the `renderLocation` option is set to a value other than `none`
	 * to actually render the contents.
	 */
	renderAs: 'inline-markdown' | 'plaintext'
}

export type ProcessPlaintext<PreprocessCodeFn = ReplaceCodeFn> = {
	/**
	 * Allows preprocessing the targeted code plaintext before performing syntax highlighting
	 * or rendering. This is done during the `preprocessCode` hook phase.
	 *
	 * Note that replacements done by this option are applied to both the code that is rendered
	 * and the code that is copied to the clipboard. You can use the `replaceInCopiedCode` option
	 * either as an alternative or in combination with this option to specify replacements that
	 * should only be applied to the code that is copied to the clipboard. When using both options,
	 * this creates two separate versions of the code: one for rendering and one for copying.
	 */
	preprocessCode?: string[] | PreprocessCodeFn | undefined
}

export type CopyOptions<ReplaceInCopiedCodeFn = ReplaceCodeFn> = {
	/**
	 * Allows replacing the targeted code plaintext when preparing the version that can be copied
	 * to the clipboard. The replacements will be done in the `postprocessAnalyzedCode` hook phase.
	 *
	 * You can either provide a string that will be used as a direct replacement,
	 * or a function that will be called with the context of the current code block
	 * and annotation comment, and is expected to return the replacement string.
	 *
	 * For example, a handler for deleted lines could use this to create a commented out version
	 * of the targeted lines. Without this, the deletions would not be recognizable in the
	 * copied code, as its plaintext format cannot contain the formatting of rendered annotations.
	 */
	replaceInCopiedCode?: string[] | ReplaceInCopiedCodeFn | undefined
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

export class ReplaceInCopiedCodeAnnotation extends ExpressiveCodeAnnotation {
	name: string
	replacement: string | string[]

	constructor({ replacement, ...baseOptions }: { replacement: string | string[] } & AnnotationBaseOptions) {
		super(baseOptions)
		this.name = 'Replace in copied code'
		this.replacement = replacement
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => {
			// TODO: Actually perform the replacement here (or don't, and instead go through all
			// lines and check for this annotation type, replacing the code in the function that
			// generates the copied code)
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
