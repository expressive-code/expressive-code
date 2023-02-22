import { describe, expect, test } from 'vitest'
import { ExpressiveCodeAnnotation, ExpressiveCodeLine } from '../src/index'

describe('ExpressiveCodeLine', () => {
	describe('editText()', () => {
		describe('Column ranges match string.slice() behavior', () => {
			test('With start & end inside text', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8, 14)).toEqual('a test')
				line.editText(8, 14, 'working')
				expect(line.text).toEqual('This is working.')
			})
			test('With start & end at the same location', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8, 8)).toEqual('')
				line.editText(8, 8, 'not just ')
				expect(line.text).toEqual('This is not just a test.')
			})
			test('With end extending beyond text length', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8, 42)).toEqual('a test.')
				line.editText(8, 42, 'still working!')
				expect(line.text).toEqual('This is still working!')
			})
			test('With undefined start', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(undefined, 4)).toEqual('This')
				line.editText(undefined, 4, 'That')
				expect(line.text).toEqual('That is a test.')
			})
			test('With undefined end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8)).toEqual('a test.')
				line.editText(8, undefined, 'still working!')
				expect(line.text).toEqual('This is still working!')
			})
			test('With undefined start & end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(undefined, undefined)).toEqual('This is a test.')
				line.editText(undefined, undefined, 'Hello world')
				expect(line.text).toEqual('Hello world')
			})
			test('With negative start', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(-5, 14)).toEqual('test')
				line.editText(-5, 14, 'success')
				expect(line.text).toEqual('This is a success.')
			})
			test('With negative end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(5, -6)).toEqual('is a')
				line.editText(5, -6, 'was another')
				expect(line.text).toEqual('This was another test.')
			})
			test('With negative start & end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(-6, -1)).toEqual(' test')
				line.editText(-6, -1, 'wesome')
				expect(line.text).toEqual('This is awesome.')
			})
		})

		describe('Unaffected annotations remain unchanged', () => {
			test('Full-line annotations', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject([])

				// Expect the annotation to stay the same after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)

				// Perform and validate edit
				expect(line.text.slice(5, 9)).toEqual('is a')
				line.editText(5, 9, 'passed the')
				expect(line.text).toEqual('This passed the test.')

				// Check that the annotation still targets the entire line
				expect(getAnnotatedTextParts(line)).toMatchObject([])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation ends before first edit', () => {
				const parts = ['two']
				expect(getAnnotatedTextPartsAfterEdit(parts)).toMatchObject(parts)
			})
			test('Annotation ends where first edit starts', () => {
				const parts = ['three-']
				expect(getAnnotatedTextPartsAfterEdit(parts)).toMatchObject(parts)
			})
		})

		describe('Inline annotations starting at or after edits are shifted', () => {
			test('Annotation starts where edit ends -> gets shifted', () => {
				const parts = ['-five', '-seven', '-nine']
				expect(getAnnotatedTextPartsAfterEdit(parts)).toMatchObject(parts)
			})
			test('Annotation starts after edit ends -> gets shifted', () => {
				const parts = ['five', 'seven', 'nine']
				expect(getAnnotatedTextPartsAfterEdit(parts)).toMatchObject(parts)
			})
		})

		describe('Inline annotations partially overlapped by edits are trimmed', () => {
			test('Annotation end is overlapped by starting edit -> end gets trimmed', () => {
				const partsBefore = ['three-fou', '-five-si', 'even-ei']
				const partsAfter = ['three-', '-five-', 'even-']
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
			test('Annotation start is overlapped by ending edit -> start gets trimmed', () => {
				const partsBefore = ['our-five', 'ix-seven-', 'ight-ni']
				const partsAfter = ['-five', '-seven-', '-ni']
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
			test('Annotation is overlapped by edits on both sides -> both get trimmed', () => {
				const partsBefore = ['our-five-si', 'ix-seven-eigh']
				const partsAfter = ['-five-', '-seven-']
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
		})

		describe('Inline annotations fully contained in edits are removed', () => {
			test('Fully contained annotation starts at edit start -> gets removed', () => {
				const partsBefore = ['fou', 'si', 'eigh']
				const partsAfter = []
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
			test('Fully contained annotation ends at edit end -> gets removed', () => {
				const partsBefore = ['our', 'ix', 'ight']
				const partsAfter = []
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
			test('Fully contained annotation does not touch edit boundaries -> gets removed', () => {
				const partsBefore = ['ou', 'igh']
				const partsAfter = []
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
		})

		describe('Inline annotation contents are changed by fully contained edits', () => {
			test('Fully contained edit starts at annotation start -> content changes', () => {
				const partsBefore = ['four-']
				const partsAfter = ['FOUR-']
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
			test('Fully contained edit ends at annotation end -> content changes', () => {
				const partsBefore = ['-four']
				const partsAfter = ['-FOUR']
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
			test('Fully contained edit range matches annotation range -> content changes', () => {
				const partsBefore = ['four', 'six', 'eight']
				const partsAfter = ['FOUR', '6', 'wonderful']
				expect(getAnnotatedTextPartsAfterEdit(partsBefore)).toMatchObject(partsAfter)
			})
		})
	})
})

/**
 * Creates a test line, annotates the given parts in it, performs some test edits,
 * and finally returns the parts that are annotated after the edits.
 *
 * Test line:
 * - Before: `one-two-three-four-five-six-seven-eight-nine-ten`
 * - Edited: `one-two-three-FOUR-five-6-seven-wonderful-nine-ten`
 *
 * Edits:
 * - Replace `four`  with `FOUR`      (not changing string length)
 * - Replace `six`   with `6`         (reducing string length)
 * - Replace `eight` with `wonderful` (extending string length)
 */
function getAnnotatedTextPartsAfterEdit(partsToAnnotate: string[]) {
	// Set up an annotated line
	const line = new ExpressiveCodeLine('one-two-three-four-five-six-seven-eight-nine-ten')

	// Create annotations for all the given parts
	partsToAnnotate.forEach((partToAnnotate) => {
		const columnStart = line.text.indexOf(partToAnnotate)
		const columnEnd = columnStart + partToAnnotate.length
		line.annotations.push({
			name: 'del',
			render: () => true,
			inlineRange: {
				columnStart,
				columnEnd,
			},
		})
	})

	// Check that the parts were annotated correctly
	expect(getAnnotatedTextParts(line)).toMatchObject(partsToAnnotate)

	// Perform test edits on the line
	const testEdits = [
		['four', 'FOUR'],
		['six', '6'],
		['eight', 'wonderful'],
	]
	testEdits.forEach(([from, to]) => {
		const columnStart = line.text.indexOf(from)
		const columnEnd = columnStart + from.length
		line.editText(columnStart, columnEnd, to)
	})

	// Return the resulting annotated text parts
	return getAnnotatedTextParts(line)
}

function getAnnotatedTextParts(line: ExpressiveCodeLine) {
	const parts: string[] = []
	line.annotations.forEach(({ inlineRange }) => {
		if (inlineRange) {
			parts.push(line.text.slice(inlineRange.columnStart, inlineRange.columnEnd))
		}
	})
	return parts
}

function cloneAnnotation(annotation: ExpressiveCodeAnnotation) {
	const clone = { ...annotation }
	if (annotation.inlineRange) clone.inlineRange = { ...annotation.inlineRange }
	return clone
}
