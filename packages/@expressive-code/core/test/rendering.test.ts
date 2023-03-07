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
	})
	test('Ignores full-line annotations', () => {
		const line = new ExpressiveCodeLine(testText)
		line.addAnnotation({
			name: 'full-line-test',
			render: () => true,
		})
		const actual = splitLineAtAnnotationBoundaries(line)
		expect(actual.textParts).toMatchObject(['Nothing to see here!'])
	})
	describe('Single annotation', () => {
		test('Line starting with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['Nothing'])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing', ' to see here!'])
		})
		test('Line ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['here!'])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing to see ', 'here!'])
		})
		test('Annotation covering the entire text', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, [testText])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject([testText])
		})
	})
	describe('Multiple non-intersecting annotations', () => {
		test('Line starting and ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['Nothing ', ' here!'])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to see', ' here!'])
		})
		test('Annotations touching at their boundaries', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['to ', 'see here'])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see here', '!'])
		})
	})
	describe('Intersecting annotations', () => {
		test('Two annotations with matching boundaries', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['see', 'see'])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing to ', 'see', ' here!'])
		})
		test('Two annotations where one is fully contained inside the other', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['to see here', 'see'])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
		})
		test('Two partially intersecting annotations', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts(line, ['to see', 'see here'])
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
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
		expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
	})
})
