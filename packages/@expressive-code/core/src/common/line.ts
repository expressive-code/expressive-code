import { ExpressiveCodeAnnotation } from './annotation'

export class ExpressiveCodeLine {
	constructor(text: string) {
		this._text = text
	}

	private _text: string
	get text() {
		return this._text
	}

	private _annotations: ExpressiveCodeAnnotation[] = []
	get annotations() {
		return this._annotations
	}

	editText(columnStart: number | undefined, columnEnd: number | undefined, newText: string): string {
		// Match the column range logic of `String.prototype.slice()`
		let editStart = Math.min(columnStart ?? 0, this._text.length)
		let editEnd = Math.min(columnEnd ?? this._text.length, this._text.length)
		if (editStart < 0) editStart = Math.max(editStart + this._text.length, 0)
		if (editEnd < 0) editEnd = Math.max(editEnd + this._text.length, 0)

		// Determine how far the edit will shift affected annotation ranges
		const editDelta = newText.length - (editEnd - editStart)

		// Update inline annotations affected by the edit
		for (let index = this._annotations.length - 1; index >= 0; index--) {
			const annotation = this._annotations[index]

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
				this._annotations.splice(index, 1)
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
		this._text = this.text.slice(0, editStart) + newText + this.text.slice(editEnd)

		return this.text
	}
}
