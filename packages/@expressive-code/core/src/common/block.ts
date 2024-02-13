import { MetaOptions } from '../helpers/meta-options'
import { ExpressiveCodeProcessingState, validateExpressiveCodeProcessingState } from '../internal/render-block'
import { isNumber, isString, newTypeError } from '../internal/type-checks'
import { ExpressiveCodeLine } from './line'

export interface ExpressiveCodeBlockOptions {
	/**
	 * The plaintext contents of the code block.
	 */
	code: string
	/**
	 * The code block's language.
	 *
	 * Please use a valid [language identifier](https://expressive-code.com/key-features/syntax-highlighting/#supported-languages)
	 * to ensure proper syntax highlighting.
	 */
	language: string
	/**
	 * An optional meta string. In markdown or MDX documents, this is the part of the
	 * code block's opening fence that comes after the language name.
	 */
	meta?: string | undefined
	/**
	 * Optional props that can be used to influence the rendering of this code block.
	 *
	 * Plugins can add their own props to this type. To allow users to set these props through
	 * the meta string, plugins can use the `preprocessMetadata` hook to read `metaOptions`
	 * and update the `props` object accordingly.
	 */
	props?: PartialAllowUndefined<ExpressiveCodeBlockProps> | undefined
	/**
	 * The code block's locale (e.g. `en-US` or `de-DE`). This is used by plugins to display
	 * localized strings depending on the language of the containing page.
	 *
	 * If no locale is defined here, most Expressive Code integrations will attempt to auto-detect
	 * the block locale using the configured
	 * [`getBlockLocale`](https://expressive-code.com/reference/configuration/#getblocklocale)
	 * function, and finally fall back to the configured
	 * [`defaultLocale`](https://expressive-code.com/reference/configuration/#defaultlocale).
	 */
	locale?: string | undefined
	/**
	 * Optional data about the parent document the code block is located in.
	 *
	 * Integrations like `remark-expressive-code` can provide this information based on the
	 * source document being processed. There may be cases where no document is available,
	 * e.g. when the code block was created dynamically.
	 */
	parentDocument?:
		| {
				/**
				 * The full path to the source file containing the code block.
				 */
				sourceFilePath?: string | undefined
				/**
				 * A reference to the object representing the parsed source document.
				 * This reference will stay the same for all code blocks in the same document.
				 *
				 * For example, if you are using `remark-expressive-code` to render code blocks
				 * in a Markdown file, this would be the `mdast` node representing the file's
				 * root node.
				 */
				documentRoot?: unknown | undefined
				/**
				 * Data about the position of the code block in the parent document.
				 */
				positionInDocument?:
					| {
							groupIndex: number
							totalGroups?: number | undefined
					  }
					| undefined
		  }
		| undefined
}

export type PartialAllowUndefined<T> = {
	[Key in keyof T]?: T[Key] | undefined
}

export interface ExpressiveCodeBlockProps {
	/**
	 * If `true`, word wrapping will be enabled for the code block, causing lines that exceed
	 * the available width to wrap to the next line. You can use the `preserveIndent` option
	 * to control how wrapped lines are indented.
	 *
	 * If `false`, lines that exceed the available width will cause a horizontal scrollbar
	 * to appear.
	 *
	 * @note This option only affects how the code block is displayed and does not change
	 * the actual code. When copied to the clipboard, the code will still contain the
	 * original unwrapped lines.
	 *
	 * @default false
	 */
	wrap: boolean
	/**
	 * If `true`, wrapped parts of long lines will be aligned with their line's
	 * indentation level, making the wrapped code appear to start at the same column.
	 * This increases readability of the wrapped code and can be especially useful
	 * for languages where indentation is significant, e.g. Python.
	 *
	 * If `false`, wrapped parts of long lines will always start at column 1.
	 * This can be useful to reproduce terminal output.
	 *
	 * @note This option only has an effect if `wrap` is `true`. It only affects how the
	 * code block is displayed and does not change the actual code. When copied to the clipboard,
	 * the code will still contain the original unwrapped lines.
	 *
	 * @default true
	 */
	preserveIndent: boolean
}

/**
 * Represents a single code block that can be rendered by the Expressive Code engine.
 */
export class ExpressiveCodeBlock {
	constructor(options: ExpressiveCodeBlockOptions) {
		const { code, language, meta = '', props, locale, parentDocument } = options
		if (!isString(code) || !isString(language) || !isString(meta)) throw newTypeError('object of type ExpressiveCodeBlockOptions', options)
		this.#lines = []
		this.#language = language
		this.#meta = meta
		this.#metaOptions = new MetaOptions(meta)
		this.#props = props || {}
		this.#locale = locale
		this.#parentDocument = parentDocument

		// Split the code into lines and remove whitespace from the end of the lines
		const lines = code.split(/\r?\n/).map((line) => line.trimEnd())

		// Remove any fully empty lines from the start & end
		while (lines.length && !lines[0].length) lines.shift()
		while (lines.length && !lines[lines.length - 1].length) lines.pop()

		// If there are any lines left, insert them into the block
		if (lines.length) this.insertLines(0, lines)

		// Transfer core meta options to props
		this.props.wrap = this.metaOptions.getBoolean('wrap') ?? this.props.wrap
		this.props.preserveIndent = this.metaOptions.getBoolean('preserveIndent') ?? this.props.preserveIndent
	}

	/**
	 * This field exists to ensure that only actual class instances are accepted
	 * as the type `ExpressiveCodeBlock` by TypeScript. Without this workaround,
	 * plain objects with the same structure would be accepted, but fail at runtime.
	 */
	private _requireInstance = Symbol('ExpressiveCodeBlock')

	readonly #lines: ExpressiveCodeLine[]
	#language: string
	#meta: string
	#metaOptions: MetaOptions
	#props: NonNullable<ExpressiveCodeBlockOptions['props']>
	#locale: ExpressiveCodeBlockOptions['locale']
	#parentDocument: ExpressiveCodeBlockOptions['parentDocument']
	#state: ExpressiveCodeProcessingState | undefined

	/**
	 * Provides read-only access to the code block's plaintext contents.
	 */
	get code() {
		return this.#lines.map((line) => line.text).join('\n')
	}

	get language() {
		return this.#language
	}

	/**
	 * Allows getting and setting the code block's language.
	 *
	 * Setting this property may throw an error if not allowed in the current {@link state}.
	 */
	set language(value: string) {
		if (this.#state?.canEditLanguage === false) throw new Error('Cannot edit code block property "language" in the current state.')
		this.#language = value
	}

	get meta() {
		return this.#meta
	}

	/**
	 * Allows getting or setting the code block's meta string. In markdown or MDX documents,
	 * this is the part of the code block's opening fence that comes after the language name.
	 *
	 * Setting this property may throw an error if not allowed in the current {@link state}.
	 */
	set meta(value: string) {
		if (this.#state?.canEditMetadata === false) throw new Error('Cannot edit code block property "meta" in the current state.')
		this.#meta = value
		this.#metaOptions = new MetaOptions(value)
	}

	/**
	 * Provides read-only access to the parsed version of the block's {@link meta} string.
	 */
	get metaOptions() {
		return this.#metaOptions
	}

	/**
	 * Provides access to the code block's props.
	 *
	 * To allow users to set these props through the meta string, plugins can use the
	 * `preprocessMetadata` hook to read `metaOptions` and update their props accordingly.
	 *
	 * Props can be modified until rendering starts and become read-only afterwards.
	 */
	get props(): NonNullable<ExpressiveCodeBlockOptions['props']> {
		if (this.#state?.canEditMetadata === false) {
			return Object.freeze({ ...this.#props })
		}
		return this.#props
	}

	/**
	 * Allows getting the code block's locale (e.g. `en-US` or `de-DE`). It is used by plugins
	 * to display localized strings depending on the language of the containing page.
	 *
	 * Integrations like `remark-expressive-code` support multi-language sites by allowing you
	 * to provide custom logic to determine a block's locale (e.g. based on its parent document).
	 *
	 * If no locale is defined here, `ExpressiveCodeEngine` will render the code block
	 * using the `defaultLocale` provided in its configuration.
	 */
	get locale() {
		return this.#locale
	}

	/**
	 * Provides read-only access to optional data about the parent document
	 * the code block is located in.
	 *
	 * Integrations like `remark-expressive-code` can provide this information based on
	 * the source document being processed. There may be cases where no document is available,
	 * e.g. when the code block was created dynamically.
	 */
	get parentDocument() {
		return this.#parentDocument
	}

	/**
	 * Provides read-only access to the code block's processing state.
	 *
	 * The processing state controls which properties of the code block can be modified.
	 * The engine updates it automatically during rendering.
	 */
	get state() {
		if (this.#state) {
			const result: ExpressiveCodeProcessingState = { ...this.#state }
			Object.freeze(result)
			return result
		}
	}

	/**
	 * @internal
	 */
	set state(value) {
		validateExpressiveCodeProcessingState(value)
		if (this.#state) {
			if (this.#state === value) return
			throw new Error(`You cannot change the state object of a code block after assigning it once.`)
		}
		this.#state = value
	}

	/**
	 * Returns the line at the given index, or `undefined` if the index is out of range.
	 */
	getLine(index: number): ExpressiveCodeLine | undefined {
		if (!isNumber(index) || index < 0) throw new Error('Line index must be a non-negative number.')
		return this.getLines(index, index + 1)[0]
	}

	/**
	 * Returns a readonly array of lines starting at the given index and ending before
	 * the given index (exclusive). The indices support the same syntax as JavaScript’s
	 * `Array.slice` method.
	 */
	getLines(startIndex?: number, endIndex?: number) {
		return Object.freeze(this.#lines.slice(startIndex, endIndex))
	}

	/**
	 * Deletes the line at the given index.
	 *
	 * May throw an error if not allowed in the current {@link state}.
	 */
	deleteLine(index: number) {
		this.deleteLines([index])
	}

	/**
	 * Deletes the lines at the given indices.
	 *
	 * This function automatically sorts the indices in descending order before deleting the lines,
	 * so you do not need to worry about indices shifting after deleting a line.
	 *
	 * May throw an error if not allowed in the current {@link state}.
	 */
	deleteLines(indices: number[]) {
		// Validate arguments
		if (!Array.isArray(indices) || indices.length === 0 || indices.some((index) => !isNumber(index) || index < 0)) throw newTypeError('non-empty non-negative number[]', indices)
		if (this.#state?.canEditCode === false) throw new Error('Cannot delete code block lines in the current state.')

		// Sort line indices in reverse order and delete them
		const sorted = [...indices].sort((a, b) => b - a)
		let lastIndex: number
		sorted.forEach((index) => {
			if (lastIndex === index) throw new Error(`A batch of lines to delete cannot contain the same index twice. Given indices: ${JSON.stringify(indices)}`)
			lastIndex = index
			const isValidIndex = index >= 0 && index < this.#lines.length
			if (!isValidIndex)
				throw new Error(`Cannot delete invalid index ${JSON.stringify(index)} from line array (length=${this.#lines.length}). Given indices: ${JSON.stringify(indices)}`)
			this.#lines.splice(index, 1)
		})
	}

	/**
	 * Inserts a new line at the given index.
	 *
	 * May throw an error if not allowed in the current {@link state}.
	 */
	insertLine(index: number, textLine: string) {
		return this.insertLines(index, [textLine])[0]
	}

	/**
	 * Inserts multiple new lines at the given index.
	 *
	 * May throw an error if not allowed in the current {@link state}.
	 */
	insertLines(index: number, textLines: string[]) {
		// Validate arguments
		if (!isNumber(index) || index < 0) throw newTypeError('non-negative number', index)
		if (!Array.isArray(textLines) || textLines.length === 0 || textLines.some((textLine) => !isString(textLine))) throw newTypeError('non-empty string[]', textLines)
		if (this.#state?.canEditCode === false) throw new Error('Cannot insert code block lines in the current state.')
		// Note: To allow inserting a line after the last one, we need to use `<=` instead of `<`
		const isValidIndex = index >= 0 && index <= this.#lines.length
		if (!isValidIndex) throw new Error(`Cannot insert at invalid index ${JSON.stringify(index)} into line array (length=${this.#lines.length}).`)

		// Create line instances and insert them
		const lineInstances = textLines.map((text) => {
			const line = new ExpressiveCodeLine(text)
			line.parent = this
			return line
		})
		this.#lines.splice(index, 0, ...lineInstances)
		return lineInstances
	}
}
