import { describe, expect, test } from 'vitest'
import { preprocessMeta } from '../src/index'

describe('Leaves unknown contents untouched', () => {
	test('Simple text', () => {
		expect(preprocessMeta('twoslash')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'twoslash',
			title: undefined,
		})
	})

	test('Unknown properties in single or double quotes', () => {
		expect(preprocessMeta('yabba="dabba doo!"')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'yabba="dabba doo!"',
			title: undefined,
		})

		expect(preprocessMeta("multipass='leeloo dallas'")).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: [],
			meta: "multipass='leeloo dallas'",
			title: undefined,
		})
	})
})

describe('Extracts known properties', () => {
	test('Titles in single or double quotes', () => {
		expect(preprocessMeta('title="That works!"')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: [],
			meta: '',
			title: 'That works!',
		})

		expect(preprocessMeta('hello title="A double-quoted title" world')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'hello world',
			title: 'A double-quoted title',
		})

		expect(preprocessMeta("hello title='A single-quoted title' world")).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: [],
			meta: 'hello world',
			title: 'A single-quoted title',
		})
	})

	test('Line markings in curly braces', () => {
		expect(preprocessMeta('{2-5}')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: ['mark={2-5}'],
			meta: '',
			title: undefined,
		})

		expect(preprocessMeta('ins={4,10-12}')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: ['ins={4,10-12}'],
			meta: '',
			title: undefined,
		})

		expect(preprocessMeta('hello {2-5} world')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: ['mark={2-5}'],
			meta: 'hello world',
			title: undefined,
		})

		expect(preprocessMeta('twoslash del={1,2,3}')).toStrictEqual({
			inlineMarkings: [],
			lineMarkings: ['del={1,2,3}'],
			meta: 'twoslash',
			title: undefined,
		})
	})

	test.todo('Plaintext inline markings in single or double quotes', () => {
		// TODO: Test inline markings
		// TODO: Test optional marker type prefix
	})

	test.todo('RegExp inline markings in forward slashes', () => {
		// TODO: Test inline markings
		// TODO: Test optional marker type prefix
	})
})
