import { describe, expect, test } from 'vitest'
import { replaceDelimitedValues, ReplaceDelimitedValuesMatch } from '../src/helpers/string-processing'

describe('String processing', () => {
	describe('replaceDelimitedValues()', () => {
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
