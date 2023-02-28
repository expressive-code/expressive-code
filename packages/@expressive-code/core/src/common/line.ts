import { ExpressiveCodeAnnotation } from './annotation'
import { ExpressiveCodeBlock } from './block'
import { getAbsoluteRange } from './helpers'
import { z } from 'zod'

export class ExpressiveCodeLine {
	constructor(text: string) {
		if (typeof text !== 'string') throw new Error(`Expected code line text to be a string, but got ${JSON.stringify(text)}.`)
		this.#text = text
	}

	#text: string
	get text() {
		return this.#text
	}

	#parent?: ExpressiveCodeBlock
	get parent() {
		return this.#parent
	}
	set parent(value) {
		z.instanceof(ExpressiveCodeBlock, { message: 'When setting the parent of a code line, you must specify a valid code block instance.' }).parse(value)
		if (this.#parent) {
			if (this.#parent === value) return
			throw new Error(`You cannot change the parent of a code line after it has been added to a code block.`)
		}
		this.#parent = value
	}

	#annotations: ExpressiveCodeAnnotation[] = []
	getAnnotations(/*startColumn?: number, endColumn?: number*/) {
		const matchingAnnotations = this.#annotations.filter((annotation) => !!annotation)
		return Object.freeze(matchingAnnotations)
	}

	addAnnotation(annotation: ExpressiveCodeAnnotation) {
		ExpressiveCodeAnnotation.parse(annotation)
		if (this.#parent?.state?.canEditAnnotations === false) throw new Error('Cannot edit code line annotations in the current state.')
		this.#annotations.push(annotation)
	}

	deleteAnnotation(annotation: ExpressiveCodeAnnotation) {
		ExpressiveCodeAnnotation.parse(annotation)
		if (this.#parent?.state?.canEditAnnotations === false) throw new Error('Cannot edit code line annotations in the current state.')
		const index = this.#annotations.indexOf(annotation)
		if (index === -1)
			throw new Error(`Failed to delete annotation as it was not found (name=${JSON.stringify(annotation.name)}, inlineRange=${JSON.stringify(annotation.inlineRange)})`)
		this.#annotations.splice(index, 1)
	}

	editText(columnStart: number | undefined, columnEnd: number | undefined, newText: string): string {
		z.number().optional().parse(columnStart)
		z.number().optional().parse(columnEnd)
		z.string().parse(newText)
		if (this.#parent?.state?.canEditCode === false) throw new Error('Cannot edit code line text in the current state.')

		// Convert the given column positions to an absolute range
		const [editStart, editEnd] = getAbsoluteRange({ start: columnStart, end: columnEnd, rangeMax: this.#text.length })

		// Determine how far the edit will shift affected annotation ranges
		const editDelta = newText.length - (editEnd - editStart)

		// Update inline annotations affected by the edit
		for (let index = this.#annotations.length - 1; index >= 0; index--) {
			const annotation = this.#annotations[index]

			// Full-line annotations are unaffected
			if (!annotation.inlineRange) continue

			const { columnStart: annotationStart, columnEnd: annotationEnd } = annotation.inlineRange

			// If the annotation ends before the edit starts, it's unaffected
			if (annotationEnd < editStart) continue

			// If the annotation starts after the edit ends, shift the annotation range
			// based on the delta between range length and new text length
			if (annotationStart > editEnd) {
				annotation.inlineRange.columnStart += editDelta
				annotation.inlineRange.columnEnd += editDelta
				continue
			}

			// If the edit is fully contained in the annotation, keep the annotation
			// and only adjust its end based on the edit character delta
			if (editStart >= annotationStart && editEnd <= annotationEnd) {
				annotation.inlineRange.columnEnd += editDelta
				continue
			}

			// If the annotation is fully contained in the edit, remove it
			if (editStart <= annotationStart && editEnd >= annotationEnd) {
				this.#annotations.splice(index, 1)
				continue
			}

			// If we arrive here, the edit partially intersects the annotation,
			// so remove the intersection by cutting the annotation range
			if (editStart > annotationStart) {
				// The edit starts inside the annotation, so we only need to cut the end
				annotation.inlineRange.columnEnd = editStart
			} else {
				// The edit ends inside the annotation, so we need to cut the start
				// and shift the end based on the edit character delta
				annotation.inlineRange.columnStart = editEnd + editDelta
				annotation.inlineRange.columnEnd += editDelta
			}
		}

		// Perform the edit by updating our text property
		this.#text = this.text.slice(0, editStart) + newText + this.text.slice(editEnd)

		return this.text
	}
}
