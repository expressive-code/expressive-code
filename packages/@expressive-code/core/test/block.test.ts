import { describe, expect, test } from 'vitest'
import { ExpressiveCodeBlock } from '../src/common/block'
import { nonArrayValues, nonNumberValues, nonObjectValues, nonStringValues } from './utils'

describe('ExpressiveCodeBlock', () => {
	describe('Constructor', () => {
		test('Throws on invalid arguments', () => {
			const invalidFirstArgTypes = [...nonStringValues, '']
			const invalidFirstArgContents = nonStringValues.flatMap((value) => [
				{ code: value, language: '', meta: '' },
				{ code: '', language: value, meta: '' },
				// Meta can be undefined, so pass another invalid value in this case
				{ code: '', language: '', meta: value !== undefined ? value : false },
			])
			const invalidArgs = [...invalidFirstArgTypes, ...invalidFirstArgContents]

			invalidArgs.forEach((value) => {
				expect(() => {
					// @ts-expect-error Pass invalid first argument type
					new ExpressiveCodeBlock(value)
				}, `Did not throw when called with \`${JSON.stringify(value)}\` as first argument`).toThrowError()
			})
		})
		test('Returns an instance', () => {
			const block = new ExpressiveCodeBlock({ code: '', language: '', meta: '' })
			expect(block).toBeInstanceOf(ExpressiveCodeBlock)
		})
	})

	describe('getLine()', () => {
		test('Throws on invalid argument types', () => {
			const block = prepareTestBlock()
			const invalidIndices = [...nonNumberValues, -1, -15]
			invalidIndices.forEach((invalidIndex) => {
				expect(() => {
					// @ts-expect-error Test passing an invalid index
					block.getLine(invalidIndex)
				}, `Did not throw on invalid index ${JSON.stringify(invalidIndex)}`).toThrow()
			})
		})
		test('Returns undefined for non-existing lines', () => {
			const block = prepareTestBlock()
			const testCases = [
				{ index: 7, expected: undefined },
				{ index: 12, expected: undefined },
			]
			testCases.forEach((testCase) => {
				expect(block.getLine(testCase.index)?.text, `Failed for index ${JSON.stringify(testCase.index)}`).toEqual(testCase.expected)
			})
		})
		test('Returns an individual line if it exists', () => {
			const block = prepareTestBlock()
			const testCases = [
				{ index: 0, expected: '0' },
				{ index: 5, expected: '5' },
				{ index: 9, expected: undefined },
			]
			testCases.forEach((testCase) => {
				expect(block.getLine(testCase.index)?.text, `Failed for index ${JSON.stringify(testCase.index)}`).toEqual(testCase.expected)
			})
		})
	})

	describe('getLines()', () => {
		test('Returns no lines if no code was passed to constructor', () => {
			const block = new ExpressiveCodeBlock({ code: '', language: '', meta: '' })
			expect(block.getLines()).toHaveLength(0)
		})
		test('Returns the code passed to the constructor split into lines', () => {
			const testLines = ['This is great!', '', 'It seems to work.']
			const lineEndings = ['\n', '\r\n']
			lineEndings.forEach((lineEnding) => {
				const block = new ExpressiveCodeBlock({ code: testLines.join(lineEnding), language: '', meta: '' })
				expect(
					block.getLines().map((line) => line.text),
					`Failed when using line ending ${JSON.stringify(lineEnding)}`
				).toMatchObject(testLines)
			})
		})
		test('Line ranges match array.slice() behavior', () => {
			const block = prepareTestBlock()
			const testCases = [
				{ range: [4, 4], expected: '' },
				{ range: [4, 5], expected: '4' },
				{ range: [3, 6], expected: '345' },
				{ range: [0, -1], expected: '012345' },
				{ range: [-3, -1], expected: '45' },
				{ range: [1, undefined], expected: '123456' },
				{ range: [undefined, 3], expected: '012' },
				{ range: [undefined, undefined], expected: '0123456' },
			]
			testCases.forEach((testCase) => {
				expect(
					block
						.getLines(testCase.range[0], testCase.range[1])
						.map((line) => line.text)
						.join(''),
					`Failed for range ${JSON.stringify(testCase.range)}`
				).toEqual(testCase.expected)
			})
		})
	})

	describe('deleteLine()', () => {
		test('Throws on invalid argument types', () => {
			const invalidIndices = [...nonNumberValues, -1, 9]
			invalidIndices.forEach((invalidIndex) => {
				const block = prepareTestBlock()
				expect(() => {
					// @ts-expect-error Test passing an invalid index
					block.deleteLine(invalidIndex)
				}, `Did not throw on invalid index ${JSON.stringify(invalidIndex)}`).toThrow()
			})
		})
		test('Throws on indices that are out of bounds', () => {
			const invalidIndices = [-1, 9]
			invalidIndices.forEach((invalidIndex) => {
				const block = prepareTestBlock()
				expect(() => {
					block.deleteLine(invalidIndex)
				}, `Did not throw on out of bounds index ${JSON.stringify(invalidIndex)}`).toThrow()
			})
		})
		test('Deletes single lines by index', () => {
			const testCases = [
				{ indices: [0], expected: '123456' },
				{ indices: [3], expected: '012456' },
				{ indices: [6], expected: '012345' },
			]
			testCases.forEach((testCase) => {
				const block = prepareTestBlock()
				block.deleteLine(testCase.indices[0])
				expect(
					block
						.getLines()
						.map((line) => line.text)
						.join(''),
					`Failed for index ${JSON.stringify(testCase.indices[0])}`
				).toEqual(testCase.expected)
			})
		})
		test('Can be prevented when a state is set', () => {
			const block = prepareTestBlock()
			const initialCode = block.code
			block.state = {
				canEditMetadata: true,
				canEditCode: false,
				canEditAnnotations: true,
			}
			expect(() => {
				block.deleteLine(0)
			}).toThrow()
			expect(block.code).toEqual(initialCode)
		})
	})

	describe('deleteLines()', () => {
		test('Throws on invalid argument types', () => {
			const invalidArguments = [
				// Test non-arrays
				...nonArrayValues,
				// Test an empty array,
				[],
				// Test arrays that contain non-number values
				...nonNumberValues.map((value) => [4, value, 2]),
			]
			invalidArguments.forEach((invalidArgument) => {
				const block = prepareTestBlock()
				expect(() => {
					// @ts-expect-error Test an invalid argument
					block.deleteLines(invalidArgument)
				}, `Did not throw on invalid indices argument ${JSON.stringify(invalidArgument)}`).toThrow()
			})
		})
		test('Throws on repeated indices', () => {
			const invalidArguments = [
				[0, 0],
				[1, 2, 3, 1, 5],
				[4, 2, 5, 1, 2],
			]
			invalidArguments.forEach((invalidArgument) => {
				const block = prepareTestBlock()
				expect(() => {
					block.deleteLines(invalidArgument)
				}, `Did not throw on argument containing repeated indices ${JSON.stringify(invalidArgument)}`).toThrow()
			})
		})
		test('Deletes multiple lines in an array by index', () => {
			// Note: For this test, we generate test code that is > 10 lines long
			// to test if the given indices are sorted by their numerical value
			// and not by their string representation
			const code = '01234567890123'.split('').join('\n')
			const testCases = [
				{ indices: [0, 4], expected: '123567890123' },
				// If indices are not sorted numerically, this will fail
				{ indices: [3, 6, 12], expected: '01245789013' },
				{ indices: [1, 5, 2], expected: '03467890123' },
				{ indices: [1, 5, 6, 2, 3, 4], expected: '07890123' },
				{ indices: [10, 9, 4, 7, 3, 1, 13, 0, 2, 11, 8, 5, 12, 6], expected: '' },
			]
			testCases.forEach((testCase) => {
				const block = prepareTestBlock({ code })
				block.deleteLines(testCase.indices)
				expect(
					block
						.getLines()
						.map((line) => line.text)
						.join(''),
					`Failed for indices ${JSON.stringify(testCase.indices)}`
				).toEqual(testCase.expected)
			})
		})
	})

	describe('insertLine()', () => {
		test('Throws on invalid argument types', () => {
			const invalidArgumentSets = [
				// Test invalid index types
				...nonNumberValues.map((invalidIndex) => [invalidIndex, 'new line contents']),
				// Test invalid text types
				...nonStringValues.map((invalidText) => [3, invalidText]),
			]
			invalidArgumentSets.forEach((invalidArgumentSet) => {
				const block = prepareTestBlock()
				expect(() => {
					// @ts-expect-error Test passing invalid arguments
					block.insertLine(...invalidArgumentSet)
				}, `Did not throw on invalid argument set ${JSON.stringify(invalidArgumentSet)}`).toThrow()
			})
		})
		test('Throws on indices that are out of bounds', () => {
			const invalidIndices = [-1, 8]
			invalidIndices.forEach((invalidIndex) => {
				const block = prepareTestBlock()
				expect(() => {
					block.insertLine(invalidIndex, 'test line')
				}, `Did not throw on out of bounds index ${JSON.stringify(invalidIndex)}`).toThrow()
			})
		})
		test('Can be prevented when a state is set', () => {
			const block = prepareTestBlock()
			const initialCode = block.code
			block.state = {
				canEditMetadata: true,
				canEditCode: false,
				canEditAnnotations: true,
			}
			expect(() => {
				block.insertLine(0, 'This should not work.')
			}).toThrow()
			expect(block.code).toEqual(initialCode)
		})
	})

	describe('state', () => {
		test('Is undefined by default', () => {
			const block = prepareTestBlock()
			expect(block.state).toEqual(undefined)
		})
		test('Throws on invalid value types', () => {
			const invalidValues = [
				// Non-objects
				...nonObjectValues,
				// Objects with missing properties
				{},
				{ canEditMetadata: true },
				// Objects with invalid property types
				{ canEditMetadata: true, canEditCode: false, canEditAnnotations: 'hello' },
			]
			invalidValues.forEach((invalidValue) => {
				const block = prepareTestBlock()
				expect(() => {
					// @ts-expect-error Set to invalid type
					block.state = invalidValue
				}).toThrow()
			})
		})
		test('Can be set to a state object', () => {
			const block = prepareTestBlock()
			const state = {
				canEditMetadata: true,
				canEditCode: false,
				canEditAnnotations: true,
			}
			// Ensure that the state object is accepted when it was undefined before
			block.state = state
			// Ensure we can set it to the same state object again
			block.state = state
			// Ensure we can read the current value and it contains the same settings
			expect(block.state).toEqual(state)
		})
		test('Prevents reassigning the state object after setting it once', () => {
			const block = prepareTestBlock()
			const privateState = {
				canEditMetadata: true,
				canEditCode: false,
				canEditAnnotations: true,
			}
			// Set the state object once
			block.state = privateState

			// Now attempt setting it to a different object
			expect(() => {
				block.state = {
					canEditMetadata: true,
					canEditCode: true,
					canEditAnnotations: true,
				}
			}).toThrow()

			// And attempt setting it back to undefined
			expect(() => {
				block.state = undefined
			}).toThrow()

			// Ensure that state still contains the unchanged original settings
			expect(block.state).toEqual(privateState)
			expect(block.state.canEditCode).toEqual(false)
		})
		test('Protects state object properties from outside modifications', () => {
			const block = prepareTestBlock()
			const privateState = {
				canEditMetadata: true,
				canEditCode: false,
				canEditAnnotations: true,
			}
			// Set the state object once
			block.state = privateState

			// Ensure that the public getter returns a clone instead of the private state object
			expect(block.state).not.toBe(privateState)

			// Ensure that the public getter returns a frozen object
			// so that attempts to set its properties throw an error,
			// letting developers know that they are using it incorrectly
			expect(() => {
				// @ts-expect-error This is read-only
				block.state.canEditCode = true
			}).toThrow()

			// Ensure that state still contains the unchanged original settings
			expect(block.state).toEqual(privateState)
			expect(block.state.canEditCode).toEqual(false)
		})
	})

	describe('text', () => {
		test('Contains the code passed to the constructor with normalized line endings', () => {
			const testLines = `
				---
				# Example: src/pages/page.md
				layout: '../layouts/MySiteLayout.astro'
				title: 'My Markdown page'
				---
				# Title

				This is my page, written in **Markdown.**
			`
				.trim()
				.replace(/^\s+/gm, '')
				.split(/\r?\n/)

			const lineEndings = ['\n', '\r\n']
			lineEndings.forEach((lineEnding) => {
				const block = prepareTestBlock({ code: testLines.join(lineEnding) })
				expect(block.code, `Failed when using line ending ${JSON.stringify(lineEnding)}`).toEqual(testLines.join('\n'))
			})
		})

		test('Automatically removes empty lines at the beginning', () => {
			const code = [`  `, `  node -v`].join('\n')

			const block = prepareTestBlock({ code, language: 'sh' })
			expect(block.code).toEqual(`  node -v`)
		})

		test('Automatically removes empty lines at the end', () => {
			const code = [`  node -v`, `  `].join('\n')

			const block = prepareTestBlock({ code, language: 'sh' })
			expect(block.code).toEqual(`  node -v`)
		})

		test('Automatically trims whitespace at the end of every line', () => {
			const lines = [`  # Get node version  `, `  node -v\t`]
			const code = lines.join('\n')
			const trimmedCode = lines.map((line) => line.trimEnd()).join('\n')

			const block = prepareTestBlock({ code, language: 'sh' })
			expect(block.code).toEqual(trimmedCode)
		})

		test('Cannot be edited directly', () => {
			const block = prepareTestBlock({ code: 'Hello!' })
			expect(() => {
				// @ts-expect-error Attempting to set a property without setter
				block.code = 'Bye?'
			}).toThrow()
			expect(block.code).toEqual('Hello!')
		})
	})

	describe('language', () => {
		test('Contains the language passed to the constructor', () => {
			const languages = ['', 'js', 'md']
			languages.forEach((language) => {
				const block = prepareTestBlock({ language })
				expect(block.language).toEqual(language)
			})
		})
		test('Can be edited when no state is set', () => {
			const block = prepareTestBlock({ language: '' })
			block.language = 'js'
			expect(block.language).toEqual('js')
			block.language = 'md'
			expect(block.language).toEqual('md')
		})
		test('Edits can be prevented when a state is set', () => {
			const block = prepareTestBlock({ language: '' })
			const state = {
				canEditMetadata: true,
				canEditCode: true,
				canEditAnnotations: true,
			}

			// Assign state object to the block and ensure we can still change the language
			block.state = state
			block.language = 'js'
			expect(block.language).toEqual('js')

			// Prevent metadata editing and ensure the language cannot be changed
			state.canEditMetadata = false
			expect(() => {
				block.language = 'md'
			}).toThrow()
			expect(block.language).toEqual('js')

			// Allow metadata editing and ensure changing the language is possible again
			state.canEditMetadata = true
			block.language = 'md'
			expect(block.language).toEqual('md')
		})
	})

	describe('meta', () => {
		test('Contains the metadata passed to the constructor', () => {
			const metas = ['', 'twoslash', 'something="test"']
			metas.forEach((meta) => {
				const block = prepareTestBlock({ meta })
				expect(block.meta).toEqual(meta)
			})
		})
		test('Can be edited when no state is set', () => {
			const block = prepareTestBlock({ meta: '' })
			block.meta = 'twoslash'
			expect(block.meta).toEqual('twoslash')
			block.meta = 'something="test"'
			expect(block.meta).toEqual('something="test"')
		})
		test('Edits can be prevented when a state is set', () => {
			const block = prepareTestBlock({ meta: '' })
			const state = {
				canEditMetadata: true,
				canEditCode: true,
				canEditAnnotations: true,
			}

			// Assign state object to the block and ensure we can still change the metadata
			const firstMeta = 'title="src/pages/[id].json.ts"'
			block.state = state
			block.meta = firstMeta
			expect(block.meta).toEqual(firstMeta)

			// Prevent metadata editing and ensure the metadata cannot be changed
			state.canEditMetadata = false
			expect(() => {
				block.meta = '{3}'
			}).toThrow()
			expect(block.meta).toEqual(firstMeta)

			// Allow metadata editing and ensure changing the metadata is possible again
			state.canEditMetadata = true
			block.meta = '{3}'
			expect(block.meta).toEqual('{3}')
		})
	})
})

const defaultTestCode = '0123456'.split('').join('\n')

function prepareTestBlock({ code = defaultTestCode, language = '', meta = '' }: { code?: string; language?: string; meta?: string } = {}) {
	const block = new ExpressiveCodeBlock({ code, language, meta })

	return block
}
