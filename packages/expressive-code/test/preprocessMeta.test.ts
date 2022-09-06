import { describe, expect, test } from 'vitest'
import { preprocessMeta } from '../src/index'

describe('Leaves unknown contents untouched', () => {
	test('Simple text', () => {
		expect(preprocessMeta('twoslash')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'twoslash',
			title: undefined,
		})
	})

	test('Unknown properties in single or double quotes', () => {
		expect(preprocessMeta('yabba="dabba doo!"')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'yabba="dabba doo!"',
			title: undefined,
		})

		expect(preprocessMeta("multipass='leeloo dallas'")).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: "multipass='leeloo dallas'",
			title: undefined,
		})
	})

	test('Unknown properties in curly braces', () => {
		expect(preprocessMeta('whoops={13}')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'whoops={13}',
			title: undefined,
		})

		expect(preprocessMeta('nothingToSee={1-99}')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'nothingToSee={1-99}',
			title: undefined,
		})
	})
})

describe('Extracts known properties', () => {
	test('Titles in single or double quotes', () => {
		expect(preprocessMeta('title="That works!"')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: '',
			title: 'That works!',
		})

		expect(preprocessMeta('hello title="A double-quoted title" world')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'hello world',
			title: 'A double-quoted title',
		})

		expect(preprocessMeta("hello title='A single-quoted title' world")).toMatchObject({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'hello world',
			title: 'A single-quoted title',
		})
	})

	test('Line markings in curly braces', () => {
		expect(preprocessMeta('{2-5}')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: ['mark={2-5}'],
			meta: '',
			title: undefined,
		})

		expect(preprocessMeta('ins={4,10-12}')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: ['ins={4,10-12}'],
			meta: '',
			title: undefined,
		})

		expect(preprocessMeta('hello {2-5} world')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: ['mark={2-5}'],
			meta: 'hello world',
			title: undefined,
		})

		expect(preprocessMeta('twoslash del={1,2,3}')).toMatchObject({
			inlineMarkings: [],
			lineMarkings: ['del={1,2,3}'],
			meta: 'twoslash',
			title: undefined,
		})
	})

	describe('Plaintext inline markings in single or double quotes', () => {
		test('Simple text', () => {
			expect(preprocessMeta('some "double-quoted text"')).toMatchObject({
				inlineMarkings: ['mark="double-quoted text"'],
				lineMarkings: [],
				meta: 'some',
				title: undefined,
			})

			expect(preprocessMeta("and 'single-quoted text' too")).toMatchObject({
				inlineMarkings: ["mark='single-quoted text'"],
				lineMarkings: [],
				meta: 'and too',
				title: undefined,
			})
		})

		test('Containing quotes of different type', () => {
			expect(preprocessMeta('"double-quoted \'with nested single\'"')).toMatchObject({
				inlineMarkings: ['mark="double-quoted \'with nested single\'"'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})

			expect(preprocessMeta('\'single-quoted "with nested double"\'')).toMatchObject({
				inlineMarkings: ['mark=\'single-quoted "with nested double"\''],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})
		})

		test('Containing escaped quotes of same type', () => {
			expect(preprocessMeta('"double-quoted \\"with escaped inner double\\""')).toMatchObject({
				inlineMarkings: ['mark="double-quoted \\"with escaped inner double\\""'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})

			expect(preprocessMeta("'single-quoted \\'with escaped inner single\\''")).toMatchObject({
				inlineMarkings: ["mark='single-quoted \\'with escaped inner single\\''"],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})
		})

		test('With optional marker type prefixes', () => {
			expect(preprocessMeta('mark="prefixed with mark"')).toMatchObject({
				inlineMarkings: ['mark="prefixed with mark"'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})

			expect(preprocessMeta('del="prefixed with del"')).toMatchObject({
				inlineMarkings: ['del="prefixed with del"'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})

			expect(preprocessMeta('ins="prefixed with ins"')).toMatchObject({
				inlineMarkings: ['ins="prefixed with ins"'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})
		})
	})

	describe('RegExp inline markings in forward slashes', () => {
		test('Simple RegExp', () => {
			expect(preprocessMeta('/he(llo|y)/')).toMatchObject({
				inlineMarkings: ['mark=/he(llo|y)/'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})
		})

		test('Containing quotes', () => {
			expect(preprocessMeta('/they said ["\']oh, hi!["\']/')).toMatchObject({
				inlineMarkings: ['mark=/they said ["\']oh, hi!["\']/'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})
		})

		test('Containing escaped slashes', () => {
			expect(preprocessMeta('/use \\/slashes\\/ like this/')).toMatchObject({
				inlineMarkings: ['mark=/use \\/slashes\\/ like this/'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})
		})

		test('With optional marker type prefixes', () => {
			expect(preprocessMeta('mark=/prefixed with mark/')).toMatchObject({
				inlineMarkings: ['mark=/prefixed with mark/'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})

			expect(preprocessMeta('del=/prefixed with del/')).toMatchObject({
				inlineMarkings: ['del=/prefixed with del/'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})

			expect(preprocessMeta('ins=/prefixed with ins/')).toMatchObject({
				inlineMarkings: ['ins=/prefixed with ins/'],
				lineMarkings: [],
				meta: '',
				title: undefined,
			})
		})
	})
})

test('Everything combined', () => {
	expect(
		preprocessMeta(
			[
				// Non-processed meta string
				'twoslash',
				// Title attribute
				'title="src/components/DynamicAttributes.astro"',
				// Regular strings
				'"{name}"',
				'"${name}"',
				// Inline-level RegExp marking
				'/(?:[(]|=== )(tag)/',
				// Line-level deletion marking
				'del={4-5}',
				// Inline-level insertion marking
				'ins=":where(.astro-XXXXXX)"',
			].join(' ')
		)
	).toMatchObject({
		inlineMarkings: ['mark="{name}"', 'mark="${name}"', 'mark=/(?:[(]|=== )(tag)/', 'ins=":where(.astro-XXXXXX)"'],
		lineMarkings: ['del={4-5}'],
		meta: 'twoslash',
		title: 'src/components/DynamicAttributes.astro',
	})
})
