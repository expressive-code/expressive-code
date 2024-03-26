import type { Element } from '../hast'
import { AnnotationRenderPhase } from './annotation'
import { ExpressiveCodeLine } from './line'
import { ExpressiveCodeHookContextBase } from './plugin-hooks'

export interface GutterElement {
	/**
	 * When rendering code lines, the engine goes through all gutter elements registered by
	 * the installed plugins and calls this function to render the gutter element for that line.
	 *
	 * It is expected to return a HAST node that represents the gutter element. For example,
	 * the line numbers plugin uses the `hastscript` library here to create an HTML element
	 * containing the current line number.
	 *
	 * After rendering all gutter elements registered by the installed plugins, the engine adds
	 * the returned HAST nodes as children to the line's gutter container.
	 *
	 * Please ensure (e.g. through CSS defined in your plugin's base styles) that your gutter
	 * element has a fixed width across all lines, even if you don't render any content inside
	 * your element for some lines. As each line's gutter container is immediately followed
	 * by the line's code contents, the combined width of all gutter elements must stay constant
	 * to ensure that the code contents of all lines are aligned.
	 */
	renderLine(context: GutterRenderContext): Element
	/**
	 * Some plugins may render lines that are not part of the original code, e.g. to display
	 * the expected output of a call right inside the code block.
	 *
	 * To properly align such lines with the original code, plugins can request an empty line
	 * from the engine using the `renderEmptyLine` context function.
	 *
	 * When called, the engine goes through all gutter elements registered by the installed plugins
	 * and calls their `renderPlaceholder` function to render the placeholder gutter contents.
	 */
	renderPlaceholder(): Element
	/**
	 * Determines the phase in which this gutter element should be rendered.
	 * Rendering is done in phases, from `earliest` to `latest`.
	 * Elements with the same phase are rendered in the order they were added.
	 *
	 * The earlier a gutter element is rendered, the further to the beginning of the line
	 * it will be placed. For example, the line numbers plugin renders its gutter elements
	 * in the `earlier` phase to ensure that they are placed before most other gutter elements.
	 *
	 * The default phase is `normal`.
	 */
	renderPhase?: AnnotationRenderPhase | undefined
}

export type GutterRenderContext = ExpressiveCodeHookContextBase & { line: ExpressiveCodeLine; lineIndex: number }
