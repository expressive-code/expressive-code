import { ExpressiveCodeProcessingState, validateExpressiveCodeProcessingState } from '../internal/render-block'
import { isNumber, isString, newTypeError } from '../internal/type-checks'
import { ExpressiveCodeLine } from './line'

export interface ExpressiveCodeBlockOptions {
	code: string
	language: string
	meta?: string | undefined
	/**
	 * The code block's locale (e.g. `en-US` or `de-DE`). This is used by plugins to display
	 * localized strings depending on the language of the containing page.
	 *
	 * Integrations like `remark-expressive-code` support multi-language sites by allowing you
	 * to provide custom logic to determine a block's locale (e.g. based on its parent document).
	 *
	 * If no locale is defined here, `ExpressiveCodeEngine` will render the code block
	 * using the `defaultLocale` provided in its configuration.
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
		  }
		| undefined
}

export class ExpressiveCodeBlock {
	constructor(options: ExpressiveCodeBlockOptions) {
		const { code, language, meta = '', locale, parentDocument } = options
		if (!isString(code) || !isString(language) || !isString(meta)) throw newTypeError('object of type ExpressiveCodeBlockOptions', options)
		this.#lines = []
		this.#language = language
		this.#meta = meta
		this.#locale = locale
		this.#parentDocument = parentDocument

		// Split the code into lines and remove whitespace from the end of the lines
		const lines = code.split(/\r?\n/).map((line) => line.trimEnd())

		// Remove any fully empty lines from the start & end
		while (lines.length && !lines[0].length) lines.shift()
		while (lines.length && !lines[lines.length - 1].length) lines.pop()

		// If there are any lines left, insert them into the block
		if (lines.length) this.insertLines(0, lines)
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
	#locale: ExpressiveCodeBlockOptions['locale']
	#parentDocument: ExpressiveCodeBlockOptions['parentDocument']
	#state: ExpressiveCodeProcessingState | undefined

	get code() {
		return this.#lines.map((line) => line.text).join('\n')
	}

	get language() {
		return this.#language
	}

	set language(value: string) {
		if (this.#state?.canEditMetadata === false) throw new Error('Cannot edit code block property "language" in the current state.')
		this.#language = value
	}

	get meta() {
		return this.#meta
	}

	set meta(value: string) {
		if (this.#state?.canEditMetadata === false) throw new Error('Cannot edit code block property "meta" in the current state.')
		this.#meta = value
	}

	get locale() {
		return this.#locale
	}

	get parentDocument() {
		return this.#parentDocument
	}

	get state() {
		if (this.#state) {
			const result: ExpressiveCodeProcessingState = { ...this.#state }
			Object.freeze(result)
			return result
		}
	}
	set state(value) {
		validateExpressiveCodeProcessingState(value)
		if (this.#state) {
			if (this.#state === value) return
			throw new Error(`You cannot change the state object of a code block after assigning it once.`)
		}
		this.#state = value
	}

	getLine(index: number): ExpressiveCodeLine | undefined {
		if (!isNumber(index) || index < 0) throw new Error('Line index must be a non-negative number.')
		return this.getLines(index, index + 1)[0]
	}

	getLines(startIndex?: number, endIndex?: number) {
		return Object.freeze(this.#lines.slice(startIndex, endIndex))
	}

	deleteLine(index: number) {
		this.deleteLines([index])
	}

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

	insertLine(index: number, textLine: string) {
		return this.insertLines(index, [textLine])[0]
	}

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
