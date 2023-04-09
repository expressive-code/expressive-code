import { describe, expect, test } from 'vitest'
import { replaceDelimitedValues, ReplaceDelimitedValuesMatch } from '../src/helpers/string-processing'

describe('String processing', () => {
	describe('replaceDelimitedValues()', () => {
		test('Supports keys including non-alphanumeric characters', () => {
			const chars = ['_', '-', '+', '~', '@', '$', '%', 'ä', '€', '😄']
			chars.forEach((char) => {
				const keyNames = [`${char}start`, `mid${char}dle`, `end${char}`]
				keyNames.forEach((keyName) => {
					const testString = `Hello ${keyName}="This is a title" special key!`
					const matches: ReplaceDelimitedValuesMatch[] = []
					const result = replaceDelimitedValues(testString, (match) => {
						matches.push(match)
						return ''
					})
					expect(result, `String replacement failed for key name "${keyName}"`).toEqual('Hello special key!')
					expect(matches, `Match function data was incorrect for key name "${keyName}"`).toMatchObject([{ key: keyName, value: 'This is a title' }])
				})
			})
		})
		describe('Handles escaped characters in the value', () => {
			test('Escaped quote at the beginning of value', () => {
				const testString = `Oh ins="\\"well" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: '"well', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Escaped quote at the end of value', () => {
				const testString = `Oh ins="well\\"" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: 'well"', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Escaped quote in the middle of value', () => {
				const testString = `Oh ins="to be\\" continued" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: 'to be" continued', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before escaped quote in the middle of value', () => {
				const testString = `Oh ins="to be\\\\\\" continued" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: 'to be\\" continued', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before actual end of string', () => {
				const testString = `Oh ins="to be\\\\" non-continued" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh non-continued" hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: 'to be\\', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before actual end of string, followed by value without key', () => {
				const testString = `Oh ins="to be\\\\" "non-continued" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([
					{ key: 'ins', value: 'to be\\', valueStartDelimiter: '"', valueEndDelimiter: '"' },
					{ key: undefined, value: 'non-continued', valueStartDelimiter: '"', valueEndDelimiter: '"' },
				])
			})
			test('Does not remove backslashes not followed by value end delimiters', () => {
				const testString = `Oh ins="C:\\Users\\Hippo" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: 'C:\\Users\\Hippo', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
		})
		describe('Supports different value delimiter types', () => {
			test('Same character on both sides', () => {
				const testString = `Oh title="This is neat!" 'This, too.' hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([
					{ key: 'title', value: 'This is neat!', valueStartDelimiter: '"', valueEndDelimiter: '"' },
					{ key: undefined, value: 'This, too.', valueStartDelimiter: "'", valueEndDelimiter: "'" },
				])
			})
			test('Same string on both sides', () => {
				const testString = 'Oh title=|%|This is neat!|%| ```This, too.``` hi!'
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(
					testString,
					(match) => {
						matches.push(match)
						return ''
					},
					{
						keyValueSeparator: '=',
						valueDelimiters: ['|%|', '```'],
					}
				)
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([
					{ key: 'title', value: 'This is neat!', valueStartDelimiter: '|%|', valueEndDelimiter: '|%|' },
					{ key: undefined, value: 'This, too.', valueStartDelimiter: '```', valueEndDelimiter: '```' },
				])
			})
			test('Different characters on start & end', () => {
				const testString = `Oh lines={23-45} hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(
					testString,
					(match) => {
						matches.push(match)
						return ''
					},
					{
						keyValueSeparator: '=',
						valueDelimiters: ['{...}'],
					}
				)
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'lines', value: '23-45', valueStartDelimiter: '{', valueEndDelimiter: '}' }])
			})
			test('Different strings on start & end', () => {
				const testString = `Oh test=<!--not bad--> <!--huh?--> hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(
					testString,
					(match) => {
						matches.push(match)
						return ''
					},
					{
						keyValueSeparator: '=',
						valueDelimiters: ['<!--...-->'],
					}
				)
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([
					{ key: 'test', value: 'not bad', valueStartDelimiter: '<!--', valueEndDelimiter: '-->' },
					{ key: undefined, value: 'huh?', valueStartDelimiter: '<!--', valueEndDelimiter: '-->' },
				])
			})
			test('With equal signs and nested quotes of different type inside a quoted string', () => {
				const testString = `Oh ins='= "Hello"' hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: '= "Hello"', valueStartDelimiter: "'", valueEndDelimiter: "'" }])
			})
			test('With equal signs and escaped quotes of same type inside a quoted string', () => {
				const testString = `Oh ins="= \\"Astronaut\\"" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([{ key: 'ins', value: '= "Astronaut"', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('With everything combined', () => {
				const testString = `Oh ins='= "Hello"' ins="= \\"Astronaut\\"" hi!`
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(testString, (match) => {
					matches.push(match)
					return ''
				})
				expect(result).toEqual('Oh hi!')
				expect(matches).toMatchObject([
					{ key: 'ins', value: '= "Hello"', valueStartDelimiter: "'", valueEndDelimiter: "'" },
					{ key: 'ins', value: '= "Astronaut"', valueStartDelimiter: '"', valueEndDelimiter: '"' },
				])
			})
		})
		describe('Supports different key/value separators', () => {
			test('Single non-standard character', () => {
				const testString = 'Hello title:"This is a title" separator!'
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(
					testString,
					(match) => {
						matches.push(match)
						return ''
					},
					{
						keyValueSeparator: ':',
						valueDelimiters: ['"'],
					}
				)
				expect(result).toEqual('Hello separator!')
				expect(matches).toMatchObject([{ key: 'title', value: 'This is a title', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Single non-standard string', () => {
				const testString = 'Hello title==="This is a title" separator!'
				const matches: ReplaceDelimitedValuesMatch[] = []
				const result = replaceDelimitedValues(
					testString,
					(match) => {
						matches.push(match)
						return ''
					},
					{
						keyValueSeparator: '===',
						valueDelimiters: ['"'],
					}
				)
				expect(result).toEqual('Hello separator!')
				expect(matches).toMatchObject([{ key: 'title', value: 'This is a title', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
		})
	})
})
