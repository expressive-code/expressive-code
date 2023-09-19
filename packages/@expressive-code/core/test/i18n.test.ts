import { describe, expect, test } from 'vitest'
import { formatTemplate } from '../src/helpers/i18n'

describe('i18n', () => {
	describe('formatTemplate()', () => {
		test('Throws when a variable is missing', () => {
			expect(() => formatTemplate('Hello \\{dear} {userName}!', {})).toThrowError('Unknown variable name "userName" found in string template "Hello \\{dear} {userName}!".')
		})
		test('Throws when a conditional placeholder does not contain exactly 1 catch-all choice', () => {
			expect(() => formatTemplate('Loaded {itemCount;1=one} file', { itemCount: 1 })).toThrowError(
				'Expected exactly 1 catch-all choice for variable "itemCount", but found 0 in string template "Loaded {itemCount;1=one} file".'
			)
			expect(() => formatTemplate('Loaded {itemCount;1=one;two;three} file', { itemCount: 1 })).toThrowError(
				'Expected exactly 1 catch-all choice for variable "itemCount", but found 2 in string template "Loaded {itemCount;1=one;two;three} file".'
			)
		})
		test('Inserts variables into placeholders', () => {
			expect(formatTemplate('{greeting} {userName}!', { userName: 'Hippo', greeting: 'Hello' })).toEqual('Hello Hippo!')
		})
		test('Supports empty strings as variables', () => {
			expect(formatTemplate('{greeting}{userName}!', { userName: '', greeting: 'Hey' })).toEqual('Hey!')
		})
		test('Placeholder syntax can be escaped', () => {
			expect(formatTemplate('Use \\{placeholderName\\} to insert placeholders into templates.', { placeholderName: 'ERROR' })).toEqual(
				'Use {placeholderName} to insert placeholders into templates.'
			)
		})
		test('Escape characters can be escaped, too', () => {
			expect(formatTemplate('Two \\ chars (\\\\) before a placeholder: \\\\{placeholderName}', { placeholderName: 'nice' })).toEqual(
				'Two \\ chars (\\\\) before a placeholder: \\nice'
			)
		})
		test('Placeholder values can contain literal placeholder syntax', () => {
			expect(formatTemplate('Oh look, a {placeholderName}', { placeholderName: 'nested {placeholder} surprise' })).toEqual('Oh look, a nested {placeholder} surprise')
		})
		test('Supports plural syntax with numeric conditions', () => {
			const template = 'Collapsed {lineCount;0=nothing;1=a single line;<5=a few lines (actually {lineCount});{lineCount} lines}.'
			expect(formatTemplate(template, { lineCount: 0 })).toEqual('Collapsed nothing.')
			expect(formatTemplate(template, { lineCount: 1 })).toEqual('Collapsed a single line.')
			expect(formatTemplate(template, { lineCount: 3 })).toEqual('Collapsed a few lines (actually 3).')
			expect(formatTemplate(template, { lineCount: 5 })).toEqual('Collapsed 5 lines.')
		})
		test('Typical German plural example', () => {
			const template = '{lineCount} ausgeblendete {lineCount;1=Zeile;Zeilen}'
			expect(formatTemplate(template, { lineCount: 0 })).toEqual('0 ausgeblendete Zeilen')
			expect(formatTemplate(template, { lineCount: 1 })).toEqual('1 ausgeblendete Zeile')
			expect(formatTemplate(template, { lineCount: 2 })).toEqual('2 ausgeblendete Zeilen')
		})
		test('Allows up to 1 space around conditional elements', () => {
			const template = '{lineCount} ausgeblendete {lineCount; 1 = Zeile; Zeilen}'
			expect(formatTemplate(template, { lineCount: 0 })).toEqual('0 ausgeblendete Zeilen')
			expect(formatTemplate(template, { lineCount: 1 })).toEqual('1 ausgeblendete Zeile')
			expect(formatTemplate(template, { lineCount: 2 })).toEqual('2 ausgeblendete Zeilen')
		})
	})
})
