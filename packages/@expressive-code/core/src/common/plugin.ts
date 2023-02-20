export interface ExpressiveCodePlugin {
	name: string
	hooks: ExpressiveCodePluginHooks
}

export type ExpressiveCodeHook = (context: object) => void

export interface ExpressiveCodePluginHooks {
	/**
	 * Allows preprocessing the meta string and the language before any plugins can
	 * modify the code.
	 *
	 * Plugins are expected to use this hook to remove any of their syntax from the meta string.
	 * Removed information can either be stored internally or used to create annotations.
	 *
	 * As the code still matches the plaintext in the containing Markdown/MDX document at this
	 * point, this hook can be used to apply annotations by line numbers.
	 */
	preprocessMetadata: ExpressiveCodeHook

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
	preprocessCode: ExpressiveCodeHook

	/**
	 * Allows analyzing the preprocessed code and collecting language-specific syntax annotations.
	 *
	 * This hook is used by syntax highlighting plugins to run the code through `Shiki` or
	 * `Shiki-Twoslash` and to create annotations from their highlighted tokens.
	 *
	 * These annotations are then available to the following hooks and will be used during
	 * rendering.
	 */
	performSyntaxAnalysis: ExpressiveCodeHook

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
	postprocessAnalyzedCode: ExpressiveCodeHook

	/**
	 * Allows annotating the final code plaintext.
	 *
	 * As the code is read-only at this point, plugins can use this hook to create annotations
	 * on lines or inline ranges matching a specific search term.
	 */
	annotateCode: ExpressiveCodeHook

	/**
	 * Allows applying final changes to annotations before rendering.
	 *
	 * After this hook has finished processing, all annotations become read-only.
	 */
	postprocessAnnotations: ExpressiveCodeHook

	/**
	 * Allows editing the AST of a single line of code after all annotations were rendered.
	 */
	postprocessRenderedLine: ExpressiveCodeHook

	/**
	 * Allows editing the AST of the entire code block after all annotations were rendered
	 * and all lines were postprocessed.
	 */
	postprocessRenderedBlock: ExpressiveCodeHook
}
