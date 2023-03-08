import { expect } from 'vitest'
import { h } from 'hastscript'
import { AnnotationRenderOptions, ExpressiveCodeAnnotation } from '../src/common/annotation'
import { ExpressiveCodeLine } from '../src/common/line'

const nothings = [undefined, null, NaN]
const booleans = [true, false]
const strings = ['', 'true', 'false', '0', '1']
const numbers = [0, 1]

export const nonStringValues = [...nothings, ...booleans, ...numbers, {}, []]
export const nonNumberValues = [...nothings, ...booleans, ...strings, {}, []]
export const nonArrayValues = [...nothings, ...booleans, ...numbers, ...strings, {}]
export const nonObjectValues = [...nothings, ...booleans, ...numbers, ...strings, []]

export function expectToWorkOrThrow(shouldWork: boolean, testFunc: () => void) {
	if (shouldWork) return expect(testFunc).not.toThrow()
	return expect(testFunc).toThrow()
}

export function annotateMatchingTextParts(line: ExpressiveCodeLine, partsToAnnotate: string[]) {
	// Create annotations for all the given parts
	partsToAnnotate.forEach((partToAnnotate, partIndex) => {
		// For testing purposes, we only annotate the first match per part
		const columnStart = line.text.indexOf(partToAnnotate)
		if (columnStart === -1) throw new Error(`Failed to add test annotation: The string "${partToAnnotate}" was not found in line text.`)
		const columnEnd = columnStart + partToAnnotate.length
		line.addAnnotation({
			name: 'del',
			render: getWrapperRenderer(`${partIndex}`),
			inlineRange: {
				columnStart,
				columnEnd,
			},
		})
	})
}

export function getAnnotatedTextParts(line: ExpressiveCodeLine) {
	const parts: string[] = []
	line.getAnnotations().forEach(({ inlineRange }) => {
		if (inlineRange) {
			parts.push(line.text.slice(inlineRange.columnStart, inlineRange.columnEnd))
		}
	})
	return parts
}

export function cloneAnnotation(annotation: ExpressiveCodeAnnotation) {
	const clone = { ...annotation }
	if (annotation.inlineRange) clone.inlineRange = { ...annotation.inlineRange }
	return clone
}

export function getWrapperRenderer(selector = 'span') {
	return ({ nodesToTransform }: AnnotationRenderOptions) => {
		return nodesToTransform.map((node) => h(selector, [node]))
	}
}

export const testRender = getWrapperRenderer()
