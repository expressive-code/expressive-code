import { describe, expect, test } from 'vitest'
import { parseProps, ParsedProp, handleProps, PropsSyntax } from '../src/helpers/string-processing'

describe('String processing', () => {
	describe('parseProps()', () => {
		test('Can parse complex props strings', () => {
			const matches = parseProps('--buddy...=true @title=\'test\'  a=Hello=b obj={4-5}  key1 ="pretty long" key2 = false key3 ')
			expect(matches).toMatchObject([
				{ kind: 'boolean', key: '--buddy...', value: true },
				{ kind: 'string', key: '@title', value: 'test' },
				{ kind: 'string', key: 'a', value: 'Hello=b' },
				{ kind: 'range', key: 'obj', value: '4-5' },
				{ kind: 'string', key: 'key1', value: 'pretty long' },
				{ kind: 'boolean', key: 'key2', value: false },
				{ kind: 'boolean', key: 'key3', value: true },
			] satisfies Partial<ParsedProp>[])
		})
	})

	describe('handleProps()', () => {
		test('Supports keys including non-alphanumeric characters', () => {
			const chars = ['_', '-', '+', '~', '@', '$', '%', 'ä', '€', '😄']
			chars.forEach((char) => {
				const keyNames = [`${char}start`, `mid${char}dle`, `end${char}`]
				keyNames.forEach((keyName) => {
					const testString = `Hello ${keyName}="This is a title" special key!`
					const { props, result } = handleNonBooleanProps(testString)
					expect(result, `String replacement failed for key name "${keyName}"`).toEqual('Hello special key!')
					expect(props, `Match function data was incorrect for key name "${keyName}"`).toMatchObject([{ key: keyName, value: 'This is a title' }])
				})
			})
		})
		describe('Handles escaped characters in the value', () => {
			test('Escaped quote at the beginning of value', () => {
				const testString = `Oh ins="\\"well" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ key: 'ins', value: '"well', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Escaped quote at the end of value', () => {
				const testString = `Oh ins="well\\"" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ key: 'ins', value: 'well"', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Escaped quote in the middle of value', () => {
				const testString = `Oh ins="to be\\" continued" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ key: 'ins', value: 'to be" continued', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before escaped quote in the middle of value', () => {
				const testString = `Oh ins="to be\\\\\\" continued" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ key: 'ins', value: 'to be\\" continued', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before actual end of string', () => {
				const testString = `Oh ins="to be\\\\" non-continued" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh non-continued" hi!')
				expect(props).toMatchObject([{ key: 'ins', value: 'to be\\', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before actual end of string, followed by value without key', () => {
				const testString = `Oh ins="to be\\\\" "non-continued" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([
					{ key: 'ins', value: 'to be\\', valueStartDelimiter: '"', valueEndDelimiter: '"' },
					{ key: undefined, value: 'non-continued', valueStartDelimiter: '"', valueEndDelimiter: '"' },
				])
			})
			test('Does not remove backslashes not followed by value end delimiters', () => {
				const testString = `Oh ins="C:\\Users\\Hippo" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ key: 'ins', value: 'C:\\Users\\Hippo', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
		})
		describe('Supports different value delimiter types', () => {
			test('Same character on both sides', () => {
				const testString = `Oh title="This is neat!" 'This, too.' hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([
					{ key: 'title', value: 'This is neat!', valueStartDelimiter: '"', valueEndDelimiter: '"' },
					{ key: undefined, value: 'This, too.', valueStartDelimiter: "'", valueEndDelimiter: "'" },
				])
			})
			test('Same string on both sides', () => {
				const testString = 'Oh title=|%|This is neat!|%| ```This, too.``` hi!'
				const { props, result } = handleNonBooleanProps(testString, {
					keyValueSeparator: '=',
					valueDelimiters: ['|%|', '```'],
				})
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([
					{ key: 'title', value: 'This is neat!', valueStartDelimiter: '|%|', valueEndDelimiter: '|%|' },
					{ key: undefined, value: 'This, too.', valueStartDelimiter: '```', valueEndDelimiter: '```' },
				])
			})
			test('Different characters on start & end', () => {
				const testString = `Oh lines={23-45} hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ kind: 'range', key: 'lines', value: '23-45', valueStartDelimiter: '{', valueEndDelimiter: '}' }])
			})
			test('Different strings on start & end', () => {
				const testString = `Oh test=<!--not bad--> <!--huh?--> hi!`
				const { props, result } = handleNonBooleanProps(testString, {
					keyValueSeparator: '=',
					valueDelimiters: ['<!--...-->'],
				})
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([
					{ key: 'test', value: 'not bad', valueStartDelimiter: '<!--', valueEndDelimiter: '-->' },
					{ key: undefined, value: 'huh?', valueStartDelimiter: '<!--', valueEndDelimiter: '-->' },
				])
			})
			test('With equal signs and nested quotes of different type inside a quoted string', () => {
				const testString = `Oh ins='= "Hello"' hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ key: 'ins', value: '= "Hello"' }])
			})
			test('With equal signs and escaped quotes of same type inside a quoted string', () => {
				const testString = `Oh ins="= \\"Astronaut\\"" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([{ key: 'ins', value: '= "Astronaut"' }])
			})
			test('With everything combined', () => {
				const testString = `Oh ins='= "Hello"' ins="= \\"Astronaut\\"" hi!`
				const { props, result } = handleNonBooleanProps(testString)
				expect(result).toEqual('Oh hi!')
				expect(props).toMatchObject([
					{ key: 'ins', value: '= "Hello"' },
					{ key: 'ins', value: '= "Astronaut"' },
				])
			})
		})
		describe('Supports different key/value separators', () => {
			test('Single non-standard character', () => {
				const testString = 'Hello title:"This is a title" separator!'
				const { props, result } = handleNonBooleanProps(testString, {
					keyValueSeparator: ':',
					valueDelimiters: ['"'],
				})
				expect(result).toEqual('Hello separator!')
				expect(props).toMatchObject([{ key: 'title', value: 'This is a title', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Single non-standard string', () => {
				const testString = 'Hello title==="This is a title" separator!'
				const { props, result } = handleNonBooleanProps(testString, {
					keyValueSeparator: '===',
					valueDelimiters: ['"'],
				})
				expect(result).toEqual('Hello separator!')
				expect(props).toMatchObject([{ key: 'title', value: 'This is a title', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
		})
	})
})

function handleNonBooleanProps(testString: string, syntax?: PropsSyntax) {
	const props: ParsedProp[] = []
	const result = handleProps(
		testString,
		(prop) => {
			if (prop.kind === 'boolean') return false
			props.push(prop)
			return true
		},
		syntax
	)
	return { props, result }
}
