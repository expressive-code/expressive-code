import { describe, expect, test } from 'vitest'
import { getStableObjectHash, stableStringify } from '../src/helpers/objects'
import { ExpressiveCodeEngine } from '../src/common/engine'
import { ExpressiveCodePlugin } from '../src/common/plugin'

describe('stableStringify()', () => {
	test('Returns a stable sort order', () => {
		const obj = {
			a: 1,
			b: 2,
			c: 3,
		}
		const obj2 = {
			c: 3,
			b: 2,
			a: 1,
		}
		expect(stableStringify(obj)).toBe(stableStringify(obj2))
	})
	test('Returns a stable sort order for nested objects', () => {
		const obj = {
			a: 1,
			b: 2,
			c: {
				d: 4,
				e: 5,
				f: 6,
			},
		}
		const obj2 = {
			c: {
				f: 6,
				e: 5,
				d: 4,
			},
			b: 2,
			a: 1,
		}
		expect(stableStringify(obj)).toBe(stableStringify(obj2))
	})
	test('Returns a stable sort order for nested arrays', () => {
		const obj = {
			a: 1,
			b: 2,
			c: [
				{
					d: 4,
					e: 5,
					f: 6,
				},
				{
					g: 7,
					h: 8,
					i: 9,
				},
			],
		}
		const obj2 = {
			c: [
				{
					f: 6,
					e: 5,
					d: 4,
				},
				{
					i: 9,
					h: 8,
					g: 7,
				},
			],
			b: 2,
			a: 1,
		}
		expect(stableStringify(obj)).toBe(stableStringify(obj2))
	})
	test('Serializes circular references', () => {
		const obj = {
			a: 1,
			b: 2,
			c: {},
		}
		obj.c = obj
		expect(stableStringify(obj)).toBe('{"a":1,"b":2,"c":"[Circular]"}')
	})
	test('Serializes circular references in nested objects', () => {
		const obj = {
			a: 1,
			b: 2,
			c: {
				e: {},
				d: 4,
				f: 6,
			},
		}
		obj.c.e = obj.c
		expect(stableStringify(obj)).toBe('{"a":1,"b":2,"c":{"d":4,"e":"[Circular]","f":6}}')
		obj.c.e = obj
		expect(stableStringify(obj)).toBe('{"a":1,"b":2,"c":{"d":4,"e":"[Circular]","f":6}}')
	})
	test('Serializes functions to placeholders', () => {
		const obj = {
			a: 1,
			c: (input: string) => input.length,
			b: 2,
		}
		expect(stableStringify(obj)).toBe('{"a":1,"b":2,"c":"[Function]"}')
	})
	test('Serializes functions to strings if requested', () => {
		const obj = {
			a: 1,
			c: (input: string) => input.length,
			b: 2,
		}
		expect(stableStringify(obj, { includeFunctionContents: true })).toBe('{"a":1,"b":2,"c":"(input) => input.length"}')
	})
	test('Serializes an Expressive Code plugins array', () => {
		const plugins: ExpressiveCodePlugin[] = [
			{
				name: 'test',
				hooks: {
					preprocessMetadata: ({ codeBlock }) => {
						codeBlock.meta = ''
					},
				},
			},
			{
				name: 'another-test',
				hooks: {
					annotateCode: ({ addStyles }) => {
						addStyles('body { background: red; }')
					},
				},
			},
		]
		expect(stableStringify(plugins)).toBe(
			`[${[
				'{"hooks":{"preprocessMetadata":"[Function]"},"name":"test"}',
				// Validate that hooks are not sorted alphabetically,
				// but remain in the order they were defined
				'{"hooks":{"annotateCode":"[Function]"},"name":"another-test"}',
			].join(',')}]`
		)
	})
	test('Serializes an Expressive Code theme', () => {
		const engine = new ExpressiveCodeEngine({
			plugins: [],
		})
		expect(stableStringify(engine.themes)).toContain('"name":"github-dark",')
	})
	test('Serializes an Expressive Code styleOverrides object', () => {
		const engine = new ExpressiveCodeEngine({
			plugins: [],
			styleOverrides: {
				codeFontFamily: 'var(--font-family-mono)',
				borderColor: 'red',
				uiSelectionBackground: ({ theme }) => theme.colors['button.background'],
			},
		})
		const actual = stableStringify(engine.styleOverrides, { includeFunctionContents: true })
		expect(actual).toEqual('{"borderColor":"red","codeFontFamily":"var(--font-family-mono)","uiSelectionBackground":"({ theme }) => theme.colors[\\"button.background\\"]"}')
	})
	test('Does not fail on non-object values', () => {
		const testCases = [
			[undefined, 'undefined'],
			[null, 'null'],
			[true, 'true'],
			[false, 'false'],
			[0, '0'],
			[-1, '-1'],
			['', '""'],
			['test', '"test"'],
			[[], '[]'],
			// NaN does not exist in JSON, so it is converted to null
			[NaN, 'null'],
		]
		testCases.forEach(([value, expected]) => {
			expect(stableStringify(value), `Unexpected output returned for input ${JSON.stringify(value)}`).toBe(expected)
		})
	})
})

describe('getStableObjectHash()', () => {
	test('Returns a stable hash', () => {
		const obj = {
			a: 1,
			b: 2,
			c: 3,
		}
		const obj2 = {
			c: 3,
			b: 2,
			a: 1,
		}
		expect(getStableObjectHash(obj)).toBe(getStableObjectHash(obj2))
	})
	test('Allows the hash length to be specified', () => {
		const obj = {
			a: 1,
			b: 2,
			c: 3,
		}

		// Test default length
		expect(getStableObjectHash(obj)).toHaveLength(5)
		expect(getStableObjectHash(obj, {})).toHaveLength(5)

		// Test custom lengths
		for (let i = 1; i < 10; i++) {
			expect(getStableObjectHash(obj, { hashLength: i })).toHaveLength(i)
		}
	})
	test('Allows to include function contents in the hash', () => {
		const obj = {
			a: 1,
			b: 2,
			c: (input: string) => input.length,
		}
		const hash = getStableObjectHash(obj, { includeFunctionContents: true })

		// Expect hash not to equal the hash without function contents
		expect(hash).not.toBe(getStableObjectHash(obj))

		// Change the function contents and hash again
		const obj2 = {
			...obj,
			c: (input: string) => input.charCodeAt(2),
		}
		const hash2 = getStableObjectHash(obj2, { includeFunctionContents: true })

		// Expect new hash to be different from the previous one
		expect(hash2).not.toBe(hash)
	})
	test('Does not fail on non-object values', () => {
		const testCases = [
			[undefined, 'c7ke7'],
			[null, 'j2w2m'],
			[true, 'j3n03'],
			[false, 'tsbvc'],
			[0, '03t05'],
			[-1, '3hku1'],
			['', '3hkqt'],
			['test', '3ebn7'],
			[[], '3hntv'],
			// NaN does not exist in JSON, so it is converted to null
			// and therefore has the same hash as null
			[NaN, 'j2w2m'],
		]
		testCases.forEach(([value, expected]) => {
			expect(getStableObjectHash(value), `Unexpected hash returned for input ${JSON.stringify(value)}`).toBe(expected)
		})
	})
})
