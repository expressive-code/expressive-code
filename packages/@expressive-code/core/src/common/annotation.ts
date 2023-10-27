import { Parent } from 'hast-util-to-html/lib/types'
import { isNumber, newTypeError } from '../internal/type-checks'
import { ExpressiveCodeLine } from './line'
import { h } from 'hastscript'
import { getClassNames, setProperty } from '../helpers/ast'

export type ExpressiveCodeInlineRange = {
	columnStart: number
	columnEnd: number
}

// Note: We need to re-export this type to enable VS Code's "auto-implement interface" feature
// in external code using this package.
export type { Parent }
export type AnnotationRenderOptions = { nodesToTransform: Parent[]; line: ExpressiveCodeLine }

export type AnnotationRenderPhase = 'earliest' | 'earlier' | 'normal' | 'later' | 'latest'

/* c8 ignore next */
export const AnnotationRenderPhaseOrder: AnnotationRenderPhase[] = ['earliest', 'earlier', 'normal', 'later', 'latest']

export function annotationSortFn(a: ExpressiveCodeAnnotation, b: ExpressiveCodeAnnotation) {
	const indexA = AnnotationRenderPhaseOrder.indexOf(a.renderPhase || 'normal')
	const indexB = AnnotationRenderPhaseOrder.indexOf(b.renderPhase || 'normal')
	return indexA - indexB
}

export type AnnotationBaseOptions = { inlineRange?: ExpressiveCodeInlineRange | undefined; renderPhase?: AnnotationRenderPhase | undefined }

export abstract class ExpressiveCodeAnnotation {
	constructor({ inlineRange, renderPhase }: AnnotationBaseOptions) {
		if (inlineRange) validateExpressiveCodeInlineRange(inlineRange)
		this.inlineRange = inlineRange
		this.renderPhase = renderPhase
	}

	/**
	 * Renders the annotation by transforming the provided nodes.
	 *
	 * This function will be called with an array of AST nodes to transform, and is expected
	 * to return an array containing the same number of nodes.
	 *
	 * For example, you could use the `hastscript` library to wrap the received nodes
	 * in HTML elements.
	 */
	abstract render({ nodesToTransform, line }: AnnotationRenderOptions): Parent[]

	/**
	 * An optional range of columns within the line that this annotation applies to.
	 * If not provided, the annotation will apply to the entire line.
	 */
	readonly inlineRange: ExpressiveCodeInlineRange | undefined

	/**
	 * Determines the phase in which this annotation should be rendered.
	 * Rendering is done in phases, from `earliest` to `latest`.
	 * Annotations with the same phase are rendered in the order they were added.
	 *
	 * The earlier an annotation is rendered, the more likely it is to be split, modified
	 * or wrapped by later annotations. Syntax highlighting is rendered in the `earliest` phase
	 * to allow other annotations to wrap and modify the highlighted code.
	 *
	 * The default phase is `normal`.
	 */
	readonly renderPhase: AnnotationRenderPhase | undefined
}

export type InlineStyleAnnotationOptions = AnnotationBaseOptions & {
	/**
	 * Inline styles are theme-dependent, which allows plugins like syntax highlighters to
	 * style the same code differently depending on the theme.
	 *
	 * To support this, the engine creates a style variant for each theme given in the
	 * configuration, and plugins can go through the engine's `styleVariants` array to
	 * access all the themes. When adding an inline style annotation to a range of code,
	 * you must specify the index in this `styleVariants` array to indicate which theme
	 * the annotation applies to.
	 */
	styleVariantIndex: number
	color?: string | undefined
	italic?: boolean | undefined
	bold?: boolean | undefined
	underline?: boolean | undefined
}

/**
 * A theme-dependent inline style annotation.
 *
 * You can add as many inline style annotations to a line as you want, even targeting the same code
 * with multiple fully or partially overlapping annotation ranges. During rendering, these
 * annotations will be automatically optimized to avoid creating unnecessary HTML elements.
 */
export class InlineStyleAnnotation extends ExpressiveCodeAnnotation {
	styleVariantIndex: number
	color: string | undefined
	italic: boolean
	bold: boolean
	underline: boolean

	constructor({ styleVariantIndex, color, italic = false, bold = false, underline = false, ...baseOptions }: InlineStyleAnnotationOptions) {
		super(baseOptions)
		this.styleVariantIndex = styleVariantIndex
		this.color = color
		this.italic = italic
		this.bold = bold
		this.underline = underline
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		const tokenStyles: string[] = []
		const varPrefix = `--${this.styleVariantIndex}`
		if (this.color) tokenStyles.push(`${varPrefix}:${this.color}`)
		if (this.italic) tokenStyles.push(`${varPrefix}fs:italic`)
		if (this.bold) tokenStyles.push(`${varPrefix}fw:bold`)
		if (this.underline) tokenStyles.push(`${varPrefix}td:underline`)
		const tokenStyle = tokenStyles.join(';')

		return nodesToTransform.map((node) => {
			if (node.type === 'element' && node.tagName === 'span' && getClassNames(node).includes('is')) {
				// The node is already an inline style token, so we can just add to its style
				setProperty(node, 'style', (node.properties?.style?.toString() || '') + ';' + tokenStyle)
				return node
			}
			const transformedNode = h('span.is', { style: tokenStyle }, node)
			return transformedNode
		})
	}
}

function validateExpressiveCodeInlineRange(inlineRange: ExpressiveCodeInlineRange) {
	if (!isNumber(inlineRange.columnStart) || !isNumber(inlineRange.columnEnd)) throw newTypeError('ExpressiveCodeInlineRange', inlineRange)
}

export function validateExpressiveCodeAnnotation(annotation: ExpressiveCodeAnnotation) {
	try {
		if (!(annotation instanceof ExpressiveCodeAnnotation)) throw 'Not an ExpressiveCodeAnnotation instance'
		if (annotation.inlineRange) validateExpressiveCodeInlineRange(annotation.inlineRange)
	} catch (error) {
		throw newTypeError('instance of ExpressiveCodeAnnotation', annotation)
	}
}
