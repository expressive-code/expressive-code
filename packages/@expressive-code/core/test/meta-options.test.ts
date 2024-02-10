import { describe, expect, test } from 'vitest'
import { MetaOption, MetaOptions } from '../src/helpers/meta-options'

describe('MetaOptions', () => {
	describe('Provides access to parsing errors', () => {
		test('Invalid regular expressions', () => {
			const options = new MetaOptions(`Oh pattern=/(\\d+/ hi!`)
			const pattern = options.getRegExp('pattern')
			expect(pattern).toBeUndefined()
			expect(options.errors).toHaveLength(1)
			expect(options.errors?.[0]).toContain(`pattern=/(\\d+/`)
		})
	})

	describe('Throws on invalid value getter calls', () => {
		test('Throws when passing `undefined` to single value getters', () => {
			const options = new MetaOptions('some test meta')
			// @ts-expect-error Testing invalid calls
			expect(() => options.getString()).toThrow('empty key')
			// @ts-expect-error Testing invalid calls
			expect(() => options.getRange()).toThrow('empty key')
			// @ts-expect-error Testing invalid calls
			expect(() => options.getRegExp()).toThrow('empty key')
			// @ts-expect-error Testing invalid calls
			expect(() => options.getBoolean()).toThrow('empty key')
		})
		test('Throws when passing an empty string to single value getters', () => {
			const options = new MetaOptions('some test meta')
			expect(() => options.getString('')).toThrow('empty key')
			expect(() => options.getRange('')).toThrow('empty key')
			expect(() => options.getRegExp('')).toThrow('empty key')
			expect(() => options.getBoolean('')).toThrow('empty key')
		})
	})

	describe('Delimited string values', () => {
		test('getString(key) returns value', () => {
			const options = new MetaOptions(`Oh title="This is neat!" label='This, too.' hi!`)
			const title = options.getString('title')
			const label = options.getString('label')
			expect(title).toEqual('This is neat!')
			expect(label).toEqual('This, too.')
		})
		test('getString(key) returns last value of multiple matches', () => {
			const options = new MetaOptions(`Oh title="First value" title='Last value' hi!`)
			const title = options.getString('title')
			expect(title).toEqual('Last value')
		})
		test(`getStrings('') returns all values without key`, () => {
			const options = new MetaOptions(`Oh "This is neat!" 'This, too.' hi!`)
			const strings = options.getStrings('')
			expect(strings).toMatchObject(['This is neat!', 'This, too.'])
		})
		describe('Strings containing escaped characters', () => {
			test('Escaped quote at the beginning of value', () => {
				const options = new MetaOptions(`Oh ins="\\"well" hi!`)
				const ins = options.getString('ins')
				expect(ins).toEqual('"well')
			})
			test('Escaped quote at the end of value', () => {
				const testString = `Oh ins="well\\"" hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh hi!')
				expect(options).toMatchObject([{ key: 'ins', value: 'well"', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Escaped quote in the middle of value', () => {
				const testString = `Oh ins="to be\\" continued" hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh hi!')
				expect(options).toMatchObject([{ key: 'ins', value: 'to be" continued', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before escaped quote in the middle of value', () => {
				const testString = `Oh ins="to be\\\\\\" continued" hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh hi!')
				expect(options).toMatchObject([{ key: 'ins', value: 'to be\\" continued', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before actual end of string', () => {
				const testString = `Oh ins="to be\\\\" non-continued" hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh non-continued" hi!')
				expect(options).toMatchObject([{ key: 'ins', value: 'to be\\', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
			test('Backslash before actual end of string, followed by value without key', () => {
				const testString = `Oh ins="to be\\\\" "non-continued" hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh hi!')
				expect(options).toMatchObject([
					{ key: 'ins', value: 'to be\\', valueStartDelimiter: '"', valueEndDelimiter: '"' },
					{ key: undefined, value: 'non-continued', valueStartDelimiter: '"', valueEndDelimiter: '"' },
				])
			})
			test('Backslashes not followed by value end delimiters', () => {
				const testString = `Oh ins="C:\\Users\\Hippo" hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh hi!')
				expect(options).toMatchObject([{ key: 'ins', value: 'C:\\Users\\Hippo', valueStartDelimiter: '"', valueEndDelimiter: '"' }])
			})
		})
		describe('Strings containing other delimiters or separators ', () => {
			test('With equal signs and nested quotes of different type inside a quoted string', () => {
				const testString = `Oh ins='= "Hello"' hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh hi!')
				expect(options).toMatchObject([{ key: 'ins', value: '= "Hello"' }])
			})
			test('With equal signs and escaped quotes of same type inside a quoted string', () => {
				const options = new MetaOptions(`Oh ins="= \\"Astronaut\\"" hi!`)
				expect(options.getString('ins')).toEqual('= "Astronaut"')
			})
			test('With everything combined', () => {
				const testString = `Oh ins='= "Hello"' ins="= \\"Astronaut\\"" hi!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest).toEqual('Oh hi!')
				expect(options).toMatchObject([
					{ key: 'ins', value: '= "Hello"' },
					{ key: 'ins', value: '= "Astronaut"' },
				])
			})
		})
	})

	describe('Non-delimited string values', () => {
		test('getString(key) returns value', () => {
			const options = new MetaOptions(`Oh greeting=Hello test target=world! no`)
			const greeting = options.getString('greeting')
			const target = options.getString('target')
			expect(greeting).toEqual('Hello')
			expect(target).toEqual('world!')
		})
		test('getString(key) returns last value of multiple matches', () => {
			const options = new MetaOptions(`Oh title=first and title=last hi!`)
			const title = options.getString('title')
			expect(title).toEqual('last')
		})
		test(`getStrings('') does not return non-delimited strings without key as these are booleans`, () => {
			const options = new MetaOptions(`Oh This is neat! This, too. hi!`)
			const strings = options.getStrings('')
			expect(strings).toMatchObject([])
		})
	})

	describe('Range values', () => {
		test('getRange(key) returns value', () => {
			const options = new MetaOptions(`Oh lines={23-45} hi!`)
			const range = options.getRange('lines')
			expect(range).toEqual('23-45')
		})
		test('getRange(key) returns last value of multiple matches', () => {
			const options = new MetaOptions(`Oh lines={23-45} hi! lines={67-89}`)
			const range = options.getRange('lines')
			expect(range).toEqual('67-89')
		})
		test(`getRanges('') returns all values without key`, () => {
			const options = new MetaOptions(`Oh {23-45} hi! {67-89}`)
			const range = options.getRanges('')
			expect(range).toMatchObject(['23-45', '67-89'])
		})
	})

	describe('RegExp values', () => {
		test('getRegExp(key) returns value', () => {
			const options = new MetaOptions(`Oh pattern=/\\d+/ hi!`)
			const pattern = options.getRegExp('pattern')
			expect(pattern).toMatchObject(/\d+/)
		})
		test('getRegExp(key) returns last value of multiple matches', () => {
			const options = new MetaOptions(`Oh pattern=/\\d+/ hi! pattern=/\\w+/`)
			const pattern = options.getRegExp('pattern')
			expect(pattern).toMatchObject(/\w+/)
		})
		test(`getRegExps('') returns all values without key`, () => {
			const options = new MetaOptions(`Oh /\\d+/ hi! /\\w+/`)
			const pattern = options.getRegExps('')
			expect(pattern).toMatchObject([/\d+/, /\w+/])
		})
		test('Regular expressions are created with the global flag', () => {
			const options = new MetaOptions(`Oh pattern=/\\d+/ hi!`)
			const pattern = options.getRegExp('pattern')
			expect(pattern?.global).toEqual(true)
		})
	})

	describe('Boolean values', () => {
		test('getBoolean(key) returns value', () => {
			const options = new MetaOptions(`Oh wrap lineNumbers hi!`)
			const wrap = options.getBoolean('wrap')
			expect(wrap).toEqual(true)
		})
		test('getBoolean(key) returns last value of multiple matches', () => {
			const options = new MetaOptions(`Oh wrap lineNumbers wrap=false`)
			const wrap = options.getBoolean('wrap')
			const lineNumbers = options.getBoolean('lineNumbers')
			const missing = options.getBoolean('missing')
			expect(wrap).toEqual(false)
			expect(lineNumbers).toEqual(true)
			expect(missing).toBeUndefined()
		})
	})

	test('Keys including non-alphanumeric characters', () => {
		const chars = ['_', '-', '+', '~', '@', '$', '%', 'ä', '€', '😄']
		chars.forEach((char) => {
			const keyNames = [`${char}start`, `mid${char}dle`, `end${char}`]
			keyNames.forEach((keyName) => {
				const testString = `Hello ${keyName}="This is a title" special key!`
				const { options, rest } = getNonBooleanOptionsAndRest(testString)
				expect(rest, `String replacement failed for key name "${keyName}"`).toEqual('Hello special key!')
				expect(options, `Match function data was incorrect for key name "${keyName}"`).toMatchObject([{ key: keyName, value: 'This is a title' }])
			})
		})
	})

	test('Complex meta strings with everything combined', () => {
		const options = new MetaOptions(`--buddy...=true @title='test'  a=Hello=b obj={4-5}  key1 ="pretty long" key2 = false key3 `)
		expect(options.list()).toMatchObject([
			{ kind: 'boolean', key: '--buddy...', value: true },
			{ kind: 'string', key: '@title', value: 'test' },
			{ kind: 'string', key: 'a', value: 'Hello=b' },
			{ kind: 'range', key: 'obj', value: '4-5' },
			{ kind: 'string', key: 'key1', value: 'pretty long' },
			{ kind: 'boolean', key: 'key2', value: false },
			{ kind: 'boolean', key: 'key3', value: true },
		] satisfies Partial<MetaOption>[])
	})

	describe('Listing and filtering options', () => {
		test('list() returns all options', () => {
			const options = new MetaOptions('Oh wrap lineNumbers wrap=false')
			expect(options.list()).toMatchObject([
				{ kind: 'boolean', key: 'Oh', value: true },
				{ kind: 'boolean', key: 'wrap', value: true },
				{ kind: 'boolean', key: 'lineNumbers', value: true },
				{ kind: 'boolean', key: 'wrap', value: false },
			])
		})
		test('list(key) returns all options with the given key', () => {
			const options = new MetaOptions('Oh wrap lineNumbers wrap=false')
			expect(options.list('wrap')).toMatchObject([
				{ kind: 'boolean', key: 'wrap', value: true },
				{ kind: 'boolean', key: 'wrap', value: false },
			])
		})
		test('list([key1, key2, ...]) returns all options with the given keys', () => {
			const options = new MetaOptions('Oh wrap lineNumbers wrap=false')
			expect(options.list(['wrap', 'lineNumbers'])).toMatchObject([
				{ kind: 'boolean', key: 'wrap', value: true },
				{ kind: 'boolean', key: 'lineNumbers', value: true },
				{ kind: 'boolean', key: 'wrap', value: false },
			])
		})
		test('list(undefined, kind) returns all options with the given kind', () => {
			const options = new MetaOptions('Oh boy=false lineNumbers=hello wrap="test"')
			expect(options.list(undefined, 'string')).toMatchObject([
				{ kind: 'string', key: 'lineNumbers', value: 'hello' },
				{ kind: 'string', key: 'wrap', value: 'test' },
			])
		})
		test('list([key1, key2, ...], kind) returns all options with the given keys and kind', () => {
			const options = new MetaOptions(`--buddy...=true key2='test'  a=Hello=b key2={4-5}  key1 ="pretty long" key2 = false key3 `)
			expect(options.list(['a', 'key2'], 'string')).toMatchObject([
				{ kind: 'string', key: 'key2', value: 'test' },
				{ kind: 'string', key: 'a', value: 'Hello=b' },
			] satisfies Partial<MetaOption>[])
		})
	})
})

function getNonBooleanOptionsAndRest(testString: string /*, syntax?: DelimitedValuesSyntax*/) {
	const metaOptions = new MetaOptions(testString)
	const options = metaOptions.list().filter((prop) => prop.kind !== 'boolean')
	const rest = metaOptions
		.list(undefined, 'boolean')
		.map((prop) => prop.key)
		.join(' ')
	return { options, rest }
}
