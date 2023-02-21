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
			test('Full-line annotation', () => {
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
			test('Annotation ends before edit starts', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 0,
						columnEnd: 4,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['This'])

				// Expect the annotation to stay the same after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)

				// Perform and validate edit
				expect(line.text.slice(5, 9)).toEqual('is a')
				line.editText(5, 9, 'passed the')
				expect(line.text).toEqual('This passed the test.')

				// Check that the annotation still targets the same text as before
				expect(getAnnotatedTextParts(line)).toMatchObject(['This'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation ends where edit starts', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 8,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])

				// Expect the annotation to stay the same after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)

				// Perform and validate edit
				expect(line.text.slice(14, 15)).toEqual('.')
				line.editText(14, 15, ' case.')
				expect(line.text).toEqual('This is a test case.')

				// Check that the intersecting part was removed from the annotated text
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
		})

		describe('Inline annotations starting at or after edits are shifted', () => {
			test('Annotation starts where +7ch edit ends', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 8,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])

				// Expect the annotation to have a different range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 8 + 7,
					columnEnd: 14 + 7,
				}

				// Perform and validate edit
				expect(line.text.slice(5, 8)).toEqual('is ')
				line.editText(5, 8, 'should be ')
				expect(line.text).toEqual('This should be a test.')

				// Check that the intersecting part was removed from the annotated text
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation starts where -2ch edit ends', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 8,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])

				// Expect the annotation to have a different range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 8 - 2,
					columnEnd: 14 - 2,
				}

				// Perform and validate edit
				expect(line.text.slice(0, 8)).toEqual('This is ')
				line.editText(0, 8, 'Cool, ')
				expect(line.text).toEqual('Cool, a test.')

				// Check that the intersecting part was removed from the annotated text
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation starts after +6ch edit ends', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 10,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['test'])

				// Expect the annotation to have a shifted range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 10 + 6,
					columnEnd: 14 + 6,
				}

				// Perform and validate edit
				expect(line.text.slice(5, 9)).toEqual('is a')
				line.editText(5, 9, 'passed the')
				expect(line.text).toEqual('This passed the test.')

				// Check that the annotation still targets the same text as before
				expect(getAnnotatedTextParts(line)).toMatchObject(['test'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation starts after -3ch edit ends', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 10,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['test'])

				// Expect the annotation to have a shifted range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 10 - 3,
					columnEnd: 14 - 3,
				}

				// Perform and validate edit
				expect(line.text.slice(5, 9)).toEqual('is a')
				line.editText(5, 9, '^')
				expect(line.text).toEqual('This ^ test.')

				// Check that the annotation still targets the same text as before
				expect(getAnnotatedTextParts(line)).toMatchObject(['test'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
		})

		describe('Inline annotations partically intersected by edits are trimmed', () => {
			test('Annotation end gets trimmed by starting +3ch edit', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 8,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])

				// Expect the annotation to have a different range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 8,
					columnEnd: 10,
				}

				// Perform and validate edit
				expect(line.text.slice(10, 14)).toEqual('test')
				line.editText(10, 14, 'success')
				expect(line.text).toEqual('This is a success.')

				// Check that the intersecting part was removed from the annotated text
				expect(getAnnotatedTextParts(line)).toMatchObject(['a '])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation end gets trimmed by starting -1ch edit', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 8,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])

				// Expect the annotation to have a different range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 8,
					columnEnd: 10,
				}

				// Perform and validate edit
				expect(line.text.slice(10, 14)).toEqual('test')
				line.editText(10, 14, 'hit')
				expect(line.text).toEqual('This is a hit.')

				// Check that the intersecting part was removed from the annotated text
				expect(getAnnotatedTextParts(line)).toMatchObject(['a '])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation start gets trimmed by ending +6ch edit', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 8,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])

				// Expect the annotation to have a different range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 10 + 6, // Start gets cut to the end of edit + edit delta
					columnEnd: 14 + 6, // End gets shifted by edit delta only
				}

				// Perform and validate edit
				expect(line.text.slice(5, 10)).toEqual('is a ')
				line.editText(5, 10, 'passed the ')
				expect(line.text).toEqual('This passed the test.')

				// Check that the intersecting part was removed from the annotated text
				expect(getAnnotatedTextParts(line)).toMatchObject(['test'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
			test('Annotation start gets trimmed by ending -3ch edit', () => {
				// Set up an annotated line
				const line = new ExpressiveCodeLine('This is a test.')
				const originalAnnotation: ExpressiveCodeAnnotation = {
					name: 'del',
					render: () => true,
					inlineRange: {
						columnStart: 8,
						columnEnd: 14,
					},
				}
				line.annotations.push(originalAnnotation)
				expect(getAnnotatedTextParts(line)).toMatchObject(['a test'])

				// Expect the annotation to have a different range after the edit
				const expectedAnnotation = cloneAnnotation(originalAnnotation)
				expectedAnnotation.inlineRange = {
					columnStart: 10 - 3, // Start gets cut to the end of edit + edit delta
					columnEnd: 14 - 3, // End gets shifted by edit delta only
				}

				// Perform and validate edit
				expect(line.text.slice(5, 10)).toEqual('is a ')
				line.editText(5, 10, '^ ')
				expect(line.text).toEqual('This ^ test.')

				// Check that the intersecting part was removed from the annotated text
				expect(getAnnotatedTextParts(line)).toMatchObject(['test'])
				expect(line.annotations).toMatchObject([expectedAnnotation])
			})
		})

		describe.todo('Inline annotations fully contained in edits are removed', () => {
			// ...
		})

		describe.todo('Edits fully contained inside inline annotations... do what? (TBD)', () => {
			// ...
		})
	})
})

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
