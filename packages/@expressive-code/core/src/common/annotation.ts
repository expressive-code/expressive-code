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

/**
 * An abstract class representing a single annotation attached to a code line.
 *
 * You can develop your own annotations by extending this class and providing
 * implementations for its abstract methods. See the implementation of the
 * {@link InlineStyleAnnotation} class for an example.
 */
export abstract class ExpressiveCodeAnnotation {
	constructor({ inlineRange, renderPhase }: AnnotationBaseOptions) {
		if (inlineRange) validateExpressiveCodeInlineRange(inlineRange)
		this.inlineRange = inlineRange
		this.renderPhase = renderPhase ?? 'normal'
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
	readonly renderPhase: AnnotationRenderPhase
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
	/**
	 * The color of the annotation. This is expected to be a hex color string, e.g. `#888`.
	 * Using CSS variables or other color formats is possible, but prevents automatic
	 * color contrast checks from working.
	 */
	color?: string | undefined
	/**
	 * Whether the annotation should be rendered in italics.
	 */
	italic?: boolean | undefined
	/**
	 * Whether the annotation should be rendered in bold.
	 */
	bold?: boolean | undefined
	/**
	 * Whether the annotation should be rendered with an underline.
	 */
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
		super({ renderPhase: 'earliest', ...baseOptions })
		this.styleVariantIndex = styleVariantIndex
		this.color = color
		this.italic = italic
		this.bold = bold
		this.underline = underline
	}

	render({ nodesToTransform }: AnnotationRenderOptions) {
		const newStyles = new Map<string, string>()
		const varPrefix = `--${this.styleVariantIndex}`
		if (this.color) newStyles.set(varPrefix, this.color)
		if (this.italic) newStyles.set(`${varPrefix}fs`, 'italic')
		if (this.bold) newStyles.set(`${varPrefix}fw`, 'bold')
		if (this.underline) newStyles.set(`${varPrefix}td`, 'underline')
		if (newStyles.size === 0) return nodesToTransform

		const buildStyleString = (styles: Map<string, string>) => {
			return [...styles].map(([key, value]) => `${key}:${value}`).join(';')
		}

		return nodesToTransform.map((node) => {
			const isInlineStyleNode =
				node.type === 'element' &&
				node.tagName === 'span' &&
				// Our inline style nodes have no class names
				!getClassNames(node).length &&
				// Our inline style nodes contain CSS variable declarations
				node.properties?.style?.toString().startsWith('--')
			if (isInlineStyleNode) {
				// The node is already an inline style token, so we can modify its existing styles
				const existingStyles: [string, string][] = (node.properties?.style?.toString() || '').split(';').map((style) => {
					const declParts = style.split(':')
					return [declParts[0], declParts.slice(1).join(':')]
				})
				setProperty(node, 'style', buildStyleString(new Map([...existingStyles, ...newStyles])))
				return node
			}
			const transformedNode = h('span', { style: buildStyleString(newStyles) }, node)
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
