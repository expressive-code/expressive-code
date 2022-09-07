import { describe, expect, test } from 'vitest'
import { preprocessMeta, PreprocessMetaResult } from '../src/index'

const expectMetaResult = (input: string, partialExpectedResult: Partial<PreprocessMetaResult>) => {
	const { meta, annotations, ...rest } = partialExpectedResult
	const expectedResult: PreprocessMetaResult = {
		meta: meta || '',
		annotations: {
			title: undefined,
			lineMarkings: [],
			inlineMarkings: [],
			...annotations,
		},
		...rest,
	}
	expect(preprocessMeta(input)).toEqual(expectedResult)
}

const createMarkerRegExp = (input: string) => {
	try {
		return new RegExp(input, 'dg')
	} catch (error) {
		return new RegExp(input, 'g')
	}
}

describe('Leaves unknown contents untouched', () => {
	test('Simple text', () => {
		expectMetaResult('twoslash', {
			meta: 'twoslash',
		})
	})

	test('Unknown properties in single or double quotes', () => {
		expectMetaResult('yabba="dabba doo!"', {
			meta: 'yabba="dabba doo!"',
		})

		expectMetaResult("multipass='leeloo dallas'", {
			meta: "multipass='leeloo dallas'",
		})
	})

	test('Unknown properties in curly braces', () => {
		expectMetaResult('whoops={13}', {
			meta: 'whoops={13}',
		})

		expectMetaResult('nothingToSee={1-99}', {
			meta: 'nothingToSee={1-99}',
		})
	})
})

describe('Extracts known properties', () => {
	test('Titles in single or double quotes', () => {
		expectMetaResult('title="That works!"', {
			meta: '',
			annotations: {
				title: 'That works!',
			},
		})

		expectMetaResult('hello title="A double-quoted title" world', {
			meta: 'hello world',
			annotations: {
				title: 'A double-quoted title',
			},
		})

		expectMetaResult("hello title='A single-quoted title' world", {
			meta: 'hello world',
			annotations: {
				title: 'A single-quoted title',
			},
		})
	})

	test('Line markings in curly braces', () => {
		expectMetaResult('{2-5}', {
			meta: '',
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [2, 3, 4, 5] }],
			},
		})

		expectMetaResult('ins={4,10-12}', {
			meta: '',
			annotations: {
				lineMarkings: [{ markerType: 'ins', lines: [4, 10, 11, 12] }],
			},
		})

		expectMetaResult('hello {2-5} world', {
			meta: 'hello world',
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [2, 3, 4, 5] }],
			},
		})

		expectMetaResult('twoslash del={1,2,3}', {
			meta: 'twoslash',
			annotations: {
				lineMarkings: [{ markerType: 'del', lines: [1, 2, 3] }],
			},
		})
	})

	describe('Plaintext inline markings in single or double quotes', () => {
		test('Simple text', () => {
			expectMetaResult('some "double-quoted text"', {
				meta: 'some',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: 'double-quoted text' }],
				},
			})

			expectMetaResult("and 'single-quoted text' too", {
				meta: 'and too',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: 'single-quoted text' }],
				},
			})
		})

		test('Containing quotes of different type', () => {
			expectMetaResult('"double-quoted \'with nested single\'"', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: "double-quoted 'with nested single'" }],
				},
			})

			expectMetaResult('\'single-quoted "with nested double"\'', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: 'single-quoted "with nested double"' }],
				},
			})
		})

		test('Containing escaped quotes of same type', () => {
			expectMetaResult('"double-quoted \\"with escaped inner double\\""', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: 'double-quoted \\"with escaped inner double\\"' }],
				},
			})

			expectMetaResult("'single-quoted \\'with escaped inner single\\''", {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: "single-quoted \\'with escaped inner single\\'" }],
				},
			})
		})

		test('With optional marker type prefixes', () => {
			expectMetaResult('mark="prefixed with mark"', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', text: 'prefixed with mark' }],
				},
			})

			expectMetaResult('ins="prefixed with ins"', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'ins', text: 'prefixed with ins' }],
					lineMarkings: [],
					title: undefined,
				},
			})

			expectMetaResult('del="prefixed with del"', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'del', text: 'prefixed with del' }],
					lineMarkings: [],
					title: undefined,
				},
			})
		})

		test('With marker type prefix aliases', () => {
			expectMetaResult('add="prefixed with add"', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'ins', text: 'prefixed with add' }],
					lineMarkings: [],
					title: undefined,
				},
			})

			expectMetaResult('rem="prefixed with rem"', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'del', text: 'prefixed with rem' }],
					lineMarkings: [],
					title: undefined,
				},
			})
		})
	})

	describe('RegExp inline markings in forward slashes', () => {
		test('Simple RegExp', () => {
			expectMetaResult('/he(llo|y)/', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', regExp: createMarkerRegExp('he(llo|y)') }],
				},
			})
		})

		test('Containing quotes', () => {
			expectMetaResult('/they said ["\']oh, hi!["\']/', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', regExp: createMarkerRegExp('they said ["\']oh, hi!["\']') }],
				},
			})
		})

		test('Containing escaped slashes', () => {
			expectMetaResult('/use \\/slashes\\/ like this/', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', regExp: createMarkerRegExp('use \\/slashes\\/ like this') }],
					lineMarkings: [],
					title: undefined,
				},
			})
		})

		test('With optional marker type prefixes', () => {
			expectMetaResult('mark=/prefixed with mark/', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'mark', regExp: createMarkerRegExp('prefixed with mark') }],
					lineMarkings: [],
					title: undefined,
				},
			})

			expectMetaResult('ins=/prefixed with ins/', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'ins', regExp: createMarkerRegExp('prefixed with ins') }],
					lineMarkings: [],
					title: undefined,
				},
			})

			expectMetaResult('del=/prefixed with del/', {
				meta: '',
				annotations: {
					inlineMarkings: [{ markerType: 'del', regExp: createMarkerRegExp('prefixed with del') }],
					lineMarkings: [],
					title: undefined,
				},
			})
		})
	})
})

test('Everything combined', () => {
	expectMetaResult(
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
		].join(' '),
		{
			meta: 'twoslash',
			annotations: {
				title: 'src/components/DynamicAttributes.astro',
				lineMarkings: [{ markerType: 'del', lines: [4, 5] }],
				inlineMarkings: [
					{ markerType: 'mark', text: '{name}' },
					{ markerType: 'mark', text: '${name}' },
					{ markerType: 'mark', regExp: createMarkerRegExp('(?:[(]|=== )(tag)') },
					{ markerType: 'ins', text: ':where(.astro-XXXXXX)' },
				],
			},
		}
	)
})
