import { ExpressiveCodeProcessingState } from './engine'
import { ExpressiveCodeLine } from './line'
import { z } from 'zod'

const ExpressiveCodeBlockOptions = z.object({
	code: z.string(),
	language: z.string(),
	meta: z.string(),
})

type ExpressiveCodeBlockOptions = z.infer<typeof ExpressiveCodeBlockOptions>

export class ExpressiveCodeBlock {
	constructor(options: ExpressiveCodeBlockOptions) {
		const { code, language, meta } = ExpressiveCodeBlockOptions.parse(options)
		this.#lines = []
		this.#language = language
		this.#meta = meta
		if (code.length) this.insertLines(0, code.split(/\r?\n/))
	}

	readonly #lines: ExpressiveCodeLine[]
	#language: string
	#meta: string
	#state?: ExpressiveCodeProcessingState

	get text() {
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

	get state() {
		return this.#state && Object.freeze({ ...this.#state })
	}
	set state(value) {
		ExpressiveCodeProcessingState.parse(value)
		if (this.#state) {
			if (this.#state === value) return
			throw new Error(`You cannot change the state object of a code block after assigning it once.`)
		}
		this.#state = value
	}

	getLine(index: number): ExpressiveCodeLine | undefined {
		z.number().nonnegative({ message: 'Line index must be a non-negative number.' }).parse(index)
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
		z.number().array().nonempty().parse(indices)
		if (this.#state?.canEditCode === false) throw new Error('Cannot delete code block lines in the current state.')

		// Sort line indices in reverse order and delete them
		const sorted = [...indices].sort().reverse()
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
		z.number().parse(index)
		z.string().array().nonempty().parse(textLines)
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
