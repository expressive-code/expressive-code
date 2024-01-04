import { describe, expect, test } from 'vitest'
import { toHtml } from 'hast-util-to-html'
import { h } from 'hastscript'
import { ExpressiveCodeLine } from '../src/common/line'
import { renderLineToAst, splitLineAtAnnotationBoundaries } from '../src/internal/render-line'
import { ClassNameAnnotation, WrapperAnnotation, annotateMatchingTextParts, getAnnotatedTextParts, nonArrayValues, nonObjectValues } from './utils'
import { codeLineClass } from '../src/common/style-settings'
import { AnnotationBaseOptions, AnnotationRenderOptions, ExpressiveCodeAnnotation } from '../src/common/annotation'
import { Parent } from 'hast-util-to-html/lib/types'

describe('splitLineAtAnnotationBoundaries()', () => {
	const testText = 'Nothing to see here!'

	test('No annotations -> returns a single part', () => {
		const line = new ExpressiveCodeLine(testText)
		const actual = splitLineAtAnnotationBoundaries(line)
		expect(actual.textParts).toMatchObject(['Nothing to see here!'])
		expectPartsToMatchAnnotationText(line, actual)
	})

	test('Ignores full-line annotations', () => {
		const line = new ExpressiveCodeLine(testText)
		line.addAnnotation(new WrapperAnnotation())
		const actual = splitLineAtAnnotationBoundaries(line)
		expect(actual.textParts).toMatchObject(['Nothing to see here!'])
		expectPartsToMatchAnnotationText(line, actual)
	})

	describe('Single annotation', () => {
		test('Line starting with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['Nothing'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing', ' to see here!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
		test('Line ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['here!'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing to see ', 'here!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
		test('Annotation covering the entire text', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: [testText] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject([testText])
			expectPartsToMatchAnnotationText(line, actual)
		})
	})

	describe('Multiple non-intersecting annotations', () => {
		test('Line starting and ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['Nothing ', ' here!'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to see', ' here!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
		test('Annotations touching at their boundaries', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['to ', 'see here'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see here', '!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
	})

	describe('Intersecting annotations', () => {
		test('Two annotations with matching boundaries', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['see', 'see'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing to ', 'see', ' here!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
		test('Two annotations where the second is fully contained in the first', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['to see here', 'see'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
		test('Two annotations where the first is fully contained in the second', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['see', 'to see here'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
		test('Two partially intersecting annotations', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['to see', 'see here'] })
			const actual = splitLineAtAnnotationBoundaries(line)
			expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
			expectPartsToMatchAnnotationText(line, actual)
		})
	})

	test('Everything combined', () => {
		const line = new ExpressiveCodeLine(testText)
		annotateMatchingTextParts({
			line,
			partsToAnnotate: [
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
			],
		})
		const actual = splitLineAtAnnotationBoundaries(line)
		expect(actual.textParts).toMatchObject(['Nothing ', 'to ', 'see', ' here', '!'])
		expectPartsToMatchAnnotationText(line, actual)
	})
})

describe('renderLineToAst()', () => {
	const testText = 'Wow, I am rendered!'

	describe('Throws on invalid render functions', () => {
		test('Inline annotation render function returning invalid values', () => {
			const invalidValues: unknown[] = [
				// Non-array values
				...nonArrayValues,
				// Array values containing non-object values
				...nonObjectValues.map((value) => [value]),
				// Array value containing too many nodes
				h(null, ['this', 'is', 'too', 'much']).children,
				// Array value containing too few nodes
				h(null, []).children,
			]
			invalidValues.forEach((invalidValue) => {
				const line = new ExpressiveCodeLine(testText)
				line.addAnnotation(
					new InvalidRenderAnnotation({
						renderResult: invalidValue,
						inlineRange: {
							columnStart: 5,
							columnEnd: 8,
						},
					})
				)
				expect(() => renderLineToAstWrapper(line)).toThrow()
			})
		})
		test('Line-level annotation render function returning invalid values', () => {
			const invalidValues: unknown[] = [
				// Non-array values
				...nonArrayValues,
				// Array values containing non-object values
				...nonObjectValues.map((value) => [value]),
				// Array value containing too many nodes
				h(null, ['this', 'is', 'too', 'much']).children,
				// Array value containing too few nodes
				h(null, []).children,
			]
			invalidValues.forEach((invalidValue) => {
				const line = new ExpressiveCodeLine(testText)
				line.addAnnotation(new InvalidRenderAnnotation({ renderResult: invalidValue }))
				expect(() => renderLineToAstWrapper(line)).toThrow()
			})
		})
	})

	describe('Simple inline annotations', () => {
		test('Line starting with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['Wow'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}"><0>Wow</0>, I am rendered!</div>`)
		})
		test('Line ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['rendered!'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">Wow, I am <0>rendered!</0></div>`)
		})
	})

	describe('Line-level annotations', () => {
		test('Single line-level annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			line.addAnnotation(new ClassNameAnnotation({ addClass: 'del' }))
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass} del">Wow, I am rendered!</div>`)
		})
		test('Multiple line-level annotations', () => {
			const line = new ExpressiveCodeLine(testText)
			line.addAnnotation(new ClassNameAnnotation({ addClass: 'del' }))
			line.addAnnotation(new ClassNameAnnotation({ addClass: 'mark' }))
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass} del mark">Wow, I am rendered!</div>`)
		})
	})

	test('Combined line-level and inline annotations', () => {
		const line = new ExpressiveCodeLine(testText)
		line.addAnnotation(new ClassNameAnnotation({ addClass: 'del' }))
		annotateMatchingTextParts({ line, partsToAnnotate: ['rendered', 'I am rendered!'] })
		line.addAnnotation(new ClassNameAnnotation({ addClass: 'mark' }))
		expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass} del mark">Wow, <2>I am <1>rendered</1>!</2></div>`)
	})

	describe('Multiple non-intersecting annotations', () => {
		test('Line starting and ending with an annotation', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['Wow', 'rendered!'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}"><0>Wow</0>, I am <1>rendered!</1></div>`)
		})
	})

	describe('Intersecting annotations', () => {
		test('Two annotations with matching boundaries', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['rendered', 'rendered'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">Wow, I am <1><0>rendered</0></1>!</div>`)
		})
		test('Two annotations where the second is fully contained in the first', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['I am rendered', 'am'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">Wow, <0>I </0><1><0>am</0></1><0> rendered</0>!</div>`)
		})
		test('Two annotations where the first is fully contained in the second', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['am', 'I am rendered'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">Wow, <1>I <0>am</0> rendered</1>!</div>`)
		})
		test('Two partially intersecting annotations', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['Wow, I am', 'I am rendered!'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}"><0>Wow, </0><1><0>I am</0> rendered!</1></div>`)
		})
		test('Three annotations where part indices must move after merging', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['am', 'I am rendered', '!'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">Wow, <1>I <0>am</0> rendered</1><2>!</2></div>`)
		})
	})

	describe('Ensures that empty lines are visible', () => {
		test('Empty lines are rendered with a line break inside', () => {
			const line = new ExpressiveCodeLine('')
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">\n</div>`)
		})
		test('Empty lines also work with line-level annotations', () => {
			const line = new ExpressiveCodeLine('')
			line.addAnnotation(new ClassNameAnnotation({ addClass: 'del' }))
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass} del">\n</div>`)
		})
	})

	describe('Respects render phases', () => {
		test('Annotation #0 with phase "latest" is rendered after #1 with "normal"', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['I am rendered'], renderPhase: 'latest' })
			annotateMatchingTextParts({ line, partsToAnnotate: ['am'] })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">Wow, <0>I <1>am</1> rendered</0>!</div>`)
		})
		test('Annotation #0 with phase "normal" is rendered after #1 with "earlier"', () => {
			const line = new ExpressiveCodeLine(testText)
			annotateMatchingTextParts({ line, partsToAnnotate: ['I am rendered'] })
			annotateMatchingTextParts({ line, partsToAnnotate: ['am'], renderPhase: 'earlier' })
			expect(renderLineToHtml(line)).toEqual(`<div class="${codeLineClass}">Wow, <0>I <1>am</1> rendered</0>!</div>`)
		})
	})
})

class InvalidRenderAnnotation extends ExpressiveCodeAnnotation {
	renderResult: unknown

	constructor({ renderResult, ...baseOptions }: { renderResult: unknown } & AnnotationBaseOptions) {
		super(baseOptions)
		this.renderResult = renderResult
	}
	render(_options: AnnotationRenderOptions) {
		return this.renderResult as Parent[]
	}
}

function expectPartsToMatchAnnotationText(line: ExpressiveCodeLine, actual: ReturnType<typeof splitLineAtAnnotationBoundaries>) {
	const { textParts, partIndicesByAnnotation } = actual
	const annotations = line.getAnnotations()
	const annotatedTextParts = getAnnotatedTextParts(line)

	// Check that all annotated text parts have an entry in the map
	expect(partIndicesByAnnotation.size).toEqual(annotatedTextParts.length)

	// Check that the text parts match the annotated text parts
	annotatedTextParts.forEach((annotatedPart, annotationIndex) => {
		const partIndices = partIndicesByAnnotation.get(annotations[annotationIndex])
		expect(partIndices).toBeDefined()
		const actualPartText = partIndices!.map((partIndex) => textParts[partIndex]).join('')
		expect(actualPartText).toEqual(annotatedPart)
	})
}

function renderLineToHtml(line: ExpressiveCodeLine) {
	return toHtml(renderLineToAstWrapper(line))
}

function renderLineToAstWrapper(line: ExpressiveCodeLine) {
	return renderLineToAst({
		line,
		// Add mock values for all other context properties
		cssVar: () => '',
		cssVarName: () => '',
		styleVariants: [],
	})
}
