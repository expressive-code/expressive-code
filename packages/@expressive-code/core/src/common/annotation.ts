import type { Element, Parents } from '../hast'
import { getClassNames, setProperty, h } from '../hast'
import { isNumber, newTypeError } from '../internal/type-checks'
import { ExpressiveCodeLine } from './line'
import { ResolverContext } from './plugin'

export type ExpressiveCodeInlineRange = {
	columnStart: number
	columnEnd: number
}

export type AnnotationRenderOptions = ResolverContext & { nodesToTransform: Parents[]; line: ExpressiveCodeLine; lineIndex: number }

export type AnnotationRenderPhase = 'earliest' | 'earlier' | 'normal' | 'later' | 'latest'

/* c8 ignore next */
export const AnnotationRenderPhaseOrder: AnnotationRenderPhase[] = ['earliest', 'earlier', 'normal', 'later', 'latest']

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
	abstract render({ nodesToTransform, line, lineIndex }: AnnotationRenderOptions): Parents[]

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
	/**
	 * Inline styles can be theme-dependent, which allows plugins like syntax highlighters to
	 * style the same code differently depending on the theme.
	 *
	 * To support this, the engine creates a style variant for each theme given in the
	 * configuration, and plugins can go through the engine's `styleVariants` array to
	 * access all the themes.
	 *
	 * When adding an inline style annotation to a range of code, you can optionally set
	 * this property to a `styleVariants` array index to indicate that this annotation
	 * only applies to a specific theme. If this property is not set, the annotation will
	 * apply to all themes.
	 */
	styleVariantIndex?: number | undefined
}

/**
 * A theme-dependent inline style annotation that allows changing colors, font styles and
 * decorations of the targeted code. This annotation is used by the syntax highlighting plugin
 * to apply colors and styles to syntax tokens, and you can use it in your own plugins as well.
 *
 * You can add as many inline style annotations to a line as you want, even targeting the same code
 * with multiple fully or partially overlapping annotation ranges. During rendering, these
 * annotations will be automatically optimized to avoid creating unnecessary HTML elements.
 *
 * @note
 * If you want to publish your own plugin using the `InlineStyleAnnotation` class, import it from
 * the `@expressive-code/core` package installed as a **peer dependency** of your plugin package.
 * This ensures that your plugin does not cause a version conflict if the user has a different
 * version of Expressive Code installed on their site.
 */
export class InlineStyleAnnotation extends ExpressiveCodeAnnotation {
	color: string | undefined
	italic: boolean
	bold: boolean
	underline: boolean
	styleVariantIndex: number | undefined

	constructor({ color, italic = false, bold = false, underline = false, styleVariantIndex, ...baseOptions }: InlineStyleAnnotationOptions) {
		super(baseOptions)
		this.color = color
		this.italic = italic
		this.bold = bold
		this.underline = underline
		this.styleVariantIndex = styleVariantIndex
	}

	render({ nodesToTransform, styleVariants }: AnnotationRenderOptions) {
		const newStyles = new Map<string, string>()
		const addStylesForVariantIndex = (variantIndex: number) => {
			const varPrefix = `--${variantIndex}`
			if (this.color) newStyles.set(varPrefix, this.color)
			if (this.italic) newStyles.set(`${varPrefix}fs`, 'italic')
			if (this.bold) newStyles.set(`${varPrefix}fw`, 'bold')
			if (this.underline) newStyles.set(`${varPrefix}td`, 'underline')
		}
		const variantIndices = this.styleVariantIndex !== undefined ? [this.styleVariantIndex] : styleVariants.map((_, i) => i)
		variantIndices.forEach(addStylesForVariantIndex)
		if (newStyles.size === 0) return nodesToTransform

		const buildStyleString = (styles: Map<string, string>) => {
			return [...styles].map(([key, value]) => `${key}:${value}`).join(';')
		}

		const isInlineStyleNode = (node: Element) =>
			node.tagName === 'span' &&
			// Our inline style nodes have no class names
			!getClassNames(node).length &&
			// Our inline style nodes contain CSS variable declarations
			node.properties?.style?.toString().startsWith('--')

		const modifyExistingStyles = (node: Element, remove = false) => {
			const existingStyles: [string, string][] = (node.properties?.style?.toString() || '').split(';').map((style) => {
				const declParts = style.split(':')
				return [declParts[0], declParts.slice(1).join(':')]
			})
			const modifiedStylesMap = new Map(existingStyles)
			newStyles.forEach((value, key) => {
				if (remove) {
					modifiedStylesMap.delete(key)
				} else {
					modifiedStylesMap.set(key, value)
				}
			})
			const modifiedStyles = buildStyleString(modifiedStylesMap)
			if (modifiedStyles) {
				setProperty(node, 'style', modifiedStyles)
			} else if (node.properties?.style) {
				delete node.properties.style
			}
			return modifiedStyles
		}

		const removeNestedConflictingStyles = (node: Parents) => {
			// Remove conflicting styles from all nested inline style nodes
			for (let childIdx = node.children?.length - 1; childIdx >= 0; childIdx--) {
				const child = node.children[childIdx]
				if (child.type === 'element') {
					if (isInlineStyleNode(child)) {
						if (!modifyExistingStyles(child, true)) {
							// If the node has no styles left, replace it with its children
							node.children.splice(childIdx, 1, ...child.children)
						}
					}
					removeNestedConflictingStyles(child)
				}
			}
		}

		return nodesToTransform.map((node) => {
			// Always remove conflicting styles from the node's children
			removeNestedConflictingStyles(node)
			// If node is already an inline style token, modify its existing styles
			if (node.type === 'element' && isInlineStyleNode(node)) {
				modifyExistingStyles(node)
				return node
			}
			// Otherwise, wrap the node in a new inline style token
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
