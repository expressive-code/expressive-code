import type { Element, Parent } from 'hast-util-to-html/lib/types'
import { PluginStyles } from '../internal/css'
import { GroupContents, RenderedGroupContents } from '../internal/render-group'
import { ExpressiveCodeBlock } from './block'
import { ExpressiveCodeLine } from './line'
import { ExpressiveCodePlugin, ResolverContext } from './plugin'
import { ResolvedExpressiveCodeEngineConfig } from './engine'
import { GutterElement } from './gutter'

export interface ExpressiveCodeHookContextBase extends ResolverContext {
	codeBlock: ExpressiveCodeBlock
	groupContents: GroupContents
	locale: string
	/**
	 * The Expressive Code engine configuration, with all optional properties
	 * resolved to their default values.
	 */
	config: ResolvedExpressiveCodeEngineConfig
}

export interface ExpressiveCodeHookContext extends ExpressiveCodeHookContextBase {
	/**
	 * Adds CSS styles to the document that contains the rendered code.
	 *
	 * All styles are scoped to Expressive Code by default, so they will not affect
	 * the rest of the page. SASS-like nesting is supported. If you want to add global styles,
	 * you can use the `@at-root` rule or target `:root`, `html` or `body` in your selectors.
	 *
	 * The engine's `render` function returns all added styles in a string array along with
	 * the rendered group and block ASTs. The calling code must take care of actually adding
	 * these styles to the page. For example, it could insert them into a `<style>` element
	 * before the rendered code block.
	 *
	 * **Note for integration authors:** If you are rendering multiple code block groups on the
	 * same HTML page, you should deduplicate the returned styles at the page level.
	 * Expressive Code deduplicates styles added to the same group before returning them,
	 * but is not aware which styles are already present on the page.
	 *
	 * **Note for plugin authors:** If you are adding the same styles to every block,
	 * consider using the `baseStyles` property of the plugin instead. This allows integrations
	 * to optionally extract these styles into a separate CSS file.
	 */
	addStyles: (css: string) => void
	/**
	 * Registers a gutter element for the current code block.
	 *
	 * The engine calls the {@link GutterElement.renderLine `renderLine`} function
	 * of the gutter elements registered by all plugins for every line of the code block.
	 * The returned elements are then added as children to the line's gutter container.
	 */
	addGutterElement: (element: GutterElement) => void
}

/**
 * A context object that the engine passes to the `postprocessRenderedLine` hook function.
 *
 * In addition to the properties made available by {@link ExpressiveCodeHookContext},
 * it provides access to information about the line currently being rendered,
 * and allows modifying the rendered output.
 */
export interface PostprocessRenderedLineContext extends Omit<ExpressiveCodeHookContext, 'addGutterElement'> {
	/**
	 * A reference to the line that is currently being rendered. It is read-only at this point,
	 * but you can access all line properties, including its source code and annotations.
	 */
	line: ExpressiveCodeLine
	/**
	 * The 0-based index of the line inside the code block.
	 */
	lineIndex: number
	/**
	 * Allows modifying the line's rendered output. The `lineAst` property of this object contains
	 * the [Hypertext Abstract Syntax Tree (HAST)](https://github.com/syntax-tree/hast) node
	 * representing the rendered line.
	 *
	 * You have full control over the `lineAst` property to modify the rendered output.
	 * For example, you could add a class name to the line's root element, or you could wrap
	 * the entire line in a custom element.
	 *
	 * There is a wide range of existing utility packages that you can use to manipulate
	 * HAST elements. For more information, see the
	 * [list of utilities](https://github.com/syntax-tree/hast#list-of-utilities) in the
	 * HAST documentation.
	 */
	renderData: {
		lineAst: Element
	}
}

/**
 * A context object that the engine passes to the `postprocessRenderedBlock` hook function.
 *
 * In addition to the properties made available by {@link ExpressiveCodeHookContext},
 * it provides access to render data of the code block currently being rendered,
 * and allows modifying the rendered output.
 */
export interface PostprocessRenderedBlockContext extends Omit<ExpressiveCodeHookContext, 'addGutterElement'> {
	/**
	 * Allows modifying the block's rendered output. The `blockAst` property of this object contains
	 * the [Hypertext Abstract Syntax Tree (HAST)](https://github.com/syntax-tree/hast) node
	 * representing the rendered block.
	 *
	 * You have full control over the `blockAst` property to modify the rendered output.
	 * For example, you could add a class name to the block’s root element,
	 * wrap the entire block in a custom element, or traverse its children
	 * to find specific elements and modify them.
	 *
	 * There is a wide range of existing utility packages that you can use to manipulate
	 * HAST elements. For more information, see the
	 * [list of utilities](https://github.com/syntax-tree/hast#list-of-utilities) in the
	 * HAST documentation.
	 */
	renderData: {
		blockAst: Element
	}
}

/**
 * A context object that the engine passes to the `postprocessRenderedBlockGroup` hook function.
 *
 * It provides access to information about the code block group currently being rendered,
 * and allows modifying the rendered output.
 */
export interface PostprocessRenderedBlockGroupContext {
	/**
	 * An array of objects, each containing a reference to the code block,
	 * and its rendered HAST output. This is the same HAST element per block that is also available
	 * in the `renderData` property of the `postprocessRenderedBlock` hook context.
	 */
	renderedGroupContents: RenderedGroupContents
	/**
	 * A list of styles that plugins added to the current code block group using the `addStyles`
	 * hook context function. Each item contains the plugin name and the styles it added.
	 * You have full control over the styles at this point and can add, modify or remove them
	 * as needed.
	 */
	pluginStyles: PluginStyles[]
	/**
	 * See {@link ExpressiveCodeHookContext.addStyles}.
	 */
	addStyles: (css: string) => void
	/**
	 * Allows modifying the rendered output of a group of code blocks. The `groupAst` property of this object contains
	 * the [Hypertext Abstract Syntax Tree (HAST)](https://github.com/syntax-tree/hast) parent node
	 * surrounding all rendered blocks.
	 *
	 * This is the only property that allows you to modify the wrapper element of the entire group.
	 * You have full control over it to modify the rendered output.
	 * For example, you could add a class name to the group’s root element,
	 * or you could wrap the entire group in a custom element.
	 */
	renderData: {
		groupAst: Parent
	}
}

/**
 * The base type of all hooks. It is a function that gets called by the engine
 * and receives a context object. The context type defaults to {@link ExpressiveCodeHookContext},
 * but can vary by hook, so see the list of available hooks for the correct type.
 */
export type ExpressiveCodeHook<ContextType = ExpressiveCodeHookContext> = (context: ContextType) => void | Promise<void>

/** @internal */
export interface ExpressiveCodePluginHooks_BeforeRendering {
	/**
	 * Allows preprocessing the meta string and the language before any plugins can
	 * modify the code.
	 *
	 * Instead of accessing the raw meta string, plugins are recommended to use the parsed version
	 * of the contained options through the {@link ExpressiveCodeBlock.metaOptions} property.
	 *
	 * As the code still matches the plaintext in the containing Markdown/MDX document at this
	 * point, this hook can be used to apply annotations by line numbers.
	 */
	preprocessMetadata?: ExpressiveCodeHook | undefined

	/**
	 * Allows preprocessing the code before any language-specific hooks are run.
	 *
	 * Plugins are expected to use this hook to remove any of their syntax that could disturb
	 * annotation plugins like syntax highlighters. Removed information can either be stored
	 * internally or used to create annotations.
	 *
	 * Plugins can also use this hook to insert new code, e.g. to add type information for
	 * syntax highlighters, or to provide functionality to include external files into the
	 * code block.
	 */
	preprocessCode?: ExpressiveCodeHook | undefined

	/**
	 * Allows analyzing the preprocessed code and collecting language-specific syntax annotations.
	 *
	 * This hook is used by syntax highlighting plugins to run the code through `Shiki` or
	 * `Shiki-Twoslash` and to create annotations from their highlighted tokens.
	 *
	 * These annotations are then available to the following hooks and will be used during
	 * rendering.
	 */
	performSyntaxAnalysis?: ExpressiveCodeHook | undefined

	/**
	 * Allows postprocessing the code plaintext after collecting syntax annotations.
	 *
	 * Plugins are expected to use this hook to remove any parts from the code
	 * that should not be contained in the output. For example, if a plugin added declarations
	 * or type information during the `preprocessCode` hook to provide information to the
	 * syntax highlighter, the declarations could now be removed again.
	 *
	 * After this hook has finished processing, the plaintext of all code lines becomes read-only.
	 */
	postprocessAnalyzedCode?: ExpressiveCodeHook | undefined

	/**
	 * Allows annotating the final code plaintext.
	 *
	 * As the code is read-only at this point, plugins can use this hook to create annotations
	 * on lines or inline ranges matching a specific search term.
	 */
	annotateCode?: ExpressiveCodeHook | undefined

	/**
	 * Allows applying final changes to annotations before rendering.
	 *
	 * After this hook has finished processing, all annotations become read-only.
	 */
	postprocessAnnotations?: ExpressiveCodeHook | undefined
}

/** @internal */
export interface ExpressiveCodePluginHooks_Rendering {
	/**
	 * Allows editing the AST of a single line of code after all annotations were rendered.
	 */
	postprocessRenderedLine?: ExpressiveCodeHook<PostprocessRenderedLineContext> | undefined

	/**
	 * Allows editing the AST of the entire code block after all annotations were rendered
	 * and all lines were postprocessed.
	 */
	postprocessRenderedBlock?: ExpressiveCodeHook<PostprocessRenderedBlockContext> | undefined

	/**
	 * Allows editing the ASTs of all code blocks that were rendered as part of the same group,
	 * as well as the AST of the group root element that contains all group blocks.
	 *
	 * Groups are defined by the calling code. For example, a Remark plugin using Expressive Code
	 * to render code blocks could provide authors with a way to group related code blocks together.
	 *
	 * This hook is used by the frames plugin to display multiple code blocks as editor file tabs.
	 *
	 * Note: Even if a code block is not part of any group, this hook will still be called.
	 * Standalone code blocks are treated like a group containing only a single block.
	 */
	postprocessRenderedBlockGroup?: ExpressiveCodeHook<PostprocessRenderedBlockGroupContext> | undefined
}

export interface ExpressiveCodePluginHooks extends ExpressiveCodePluginHooks_BeforeRendering, ExpressiveCodePluginHooks_Rendering {}

export type ExpressiveCodePluginHookName = keyof ExpressiveCodePluginHooks

/**
 * Runs the given `runner` function for every hook that was registered by plugins
 * for the given hook type.
 *
 * The runner function is called with an object containing the hook name, the hook function
 * registered by the plugin, and the plugin that registered it.
 *
 * Errors occuring in the runner function are caught and rethrown with information about the
 * plugin and hook that caused the error.
 */
export async function runHooks<HookType extends keyof ExpressiveCodePluginHooks>(
	key: HookType,
	plugins: readonly ExpressiveCodePlugin[],
	runner: (hook: { hookName: HookType; hookFn: NonNullable<ExpressiveCodePluginHooks[HookType]>; plugin: ExpressiveCodePlugin }) => void | Promise<void>
) {
	for (const plugin of plugins) {
		const hookFn = plugin.hooks?.[key]
		if (!hookFn) continue

		try {
			await runner({ hookName: key, hookFn, plugin })
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			throw new Error(`Plugin "${plugin.name}" caused an error in its "${key}" hook. Error message: ${msg}`, { cause: error })
		}
	}
}
