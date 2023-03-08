import { describe, expect, test } from 'vitest'
import { ExpressiveCodeLine } from '../src/common/line'
import { splitLineAtAnnotationBoundaries } from '../src/internal/rendering'
import { annotateMatchingTextParts } from './utils'

describe('splitLineAtAnnotationBoundaries()', () => {
	const testText = 'Nothing to see here!'
	test('No annotations -> returns a single part', () => {
		const line = new ExpressiveCodeLine(testText)
		const actual = splitLineAtAnnotationBoundaries(line)
		expect(actual.textParts).toMatchObject(['Nothing to see here!'])
		expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([])
	})
	test('Ignores full-line annotations', () => {
		const line = new ExpressiveCodeLine(testText)
		line.addAnnotation({
			name: 'full-line-test',
			render: () => true,
		})
		const actual = splitLineAtAnnotationBoundaries(line)
		expect(actual.textParts).toMatchObject(['Nothing to see here!'])
		expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([])
	})
	describe('Single annotation', () => {
		test('Line starting with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['Nothing'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                            0              1
			expect(actual.textParts).toMatchObject(['Nothing', ' to see here!'])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'Nothing' (part index 0)
				[0, [0]],
			])
		})
		test('Line ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['here!'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                                0             1
			expect(actual.textParts).toMatchObject(['Nothing to see ', 'here!'])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'here!' (part index 1)
				[0, [1]],
			])
		})
		test('Annotation covering the entire text', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, [testText])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject([testText])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([[0, [0]]])
		})
	})
	describe('Multiple non-intersecting annotations', () => {
		test('Line starting and ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['Nothing ', ' here!'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                            0           1         2
			expect(actual.textParts).toMatchObject(['Nothing ', 'to see', ' here!'])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'Nothing ' (part index 0)
				[0, [0]],
				// Annotation 1: ' here!' (part index 2)
				[1, [2]],
			])
		})
		test('Annotations touching at their boundaries', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['to ', 'see here'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                            0         1        2        3
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see here', '!'])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'to ' (part index 1)
				[0, [1]],
				// Annotation 1: 'see here' (part index 2)
				[1, [2]],
			])
		})
	})
	describe('Intersecting annotations', () => {
		test('Two annotations with matching boundaries', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['see', 'see'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                              0          1        2
			expect(actual.textParts).toMatchObject(['Nothing to ', 'see', ' here!'])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'see' (part index 1)
				[0, [1]],
				// Annotation 1: 'see' (part index 1)
				[1, [1]],
			])
		})
		test('Two annotations where the second is fully contained in the first', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['to see here', 'see'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                            0         1      2        3     4
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'to see here' (part indices 1, 2, 3)
				[0, [1, 2, 3]],
				// Annotation 1: 'see' (part index 2)
				[1, [2]],
			])
		})
		test('Two annotations where the first is fully contained in the second', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['see', 'to see here'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                            0         1      2        3     4
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
			// Ensure that partIndicesByAnnotationIndex is sorted by the annotation's index,
			// even though the second annotation starts at a lower part index
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'see' (part index 2)
				[0, [2]],
				// Annotation 1: 'to see here' (part indices 1, 2, 3)
				[1, [1, 2, 3]],
			])
		})
		test('Two partially intersecting annotations', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['to see', 'see here'])
			const actual = splitLineAtAnnotationBoundaries(line)
			// Part indices:                            0         1      2        3     4
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
			expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
				// Annotation 0: 'to see' (part indices 1, 2)
				[0, [1, 2]],
				// Annotation 1: 'see here' (part indices 2, 3)
				[1, [2, 3]],
			])
		})
	})
	test('Everything combined', () => {
		const line = new ExpressiveCodeLine(testText)
		annotateMatchingTextParts(line, [
			// Touching at boundaries
			'to ',
			'see here',
			// Fully contained
			'to see here',
			'see',
			// Full line
			testText,
			// Partially intersecting
			'to see',
			'see here',
			// Matching boundaries (by repeating a part already added before)
			'see',
		])
		const actual = splitLineAtAnnotationBoundaries(line)
		// Part indices:                            0         1      2        3     4
		expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
		expect([...actual.partIndicesByAnnotationIndex.entries()]).toMatchObject([
			// Annotation 0: 'to ' (part index 1)
			[0, [1]],
			// Annotation 1: 'see here' (part indices 2, 3)
			[1, [2, 3]],
			// Annotation 2: 'to see here' (part indices 1, 2, 3)
			[2, [1, 2, 3]],
			// Annotation 3: 'see' (part index 2)
			[3, [2]],
			// Annotation 4: full text (part indices 0, 1, 2, 3, 4)
			[4, [0, 1, 2, 3, 4]],
			// Annotation 5: 'to see' (part indices 1, 2)
			[5, [1, 2]],
			// Annotation 6: 'see here' (part indices 2, 3)
			[6, [2, 3]],
			// Annotation 7: 'see' (part index 2)
			[7, [2]],
		])
	})
})
