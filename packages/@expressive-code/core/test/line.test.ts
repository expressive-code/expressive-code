import { describe, expect, test } from 'vitest'
import { ExpressiveCodeLine } from '../src/index'

describe('ExpressiveCodeLine', () => {
	describe('editText()', () => {
		describe('Column ranges match string.slice() behavior', () => {
			test('With start & end inside text', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8, 14)).toEqual('a test')
				line.editText(8, 14, 'working')
				expect(line.text).toEqual('This is working.')
			})
			test('With start & end at the same location', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8, 8)).toEqual('')
				line.editText(8, 8, 'not just ')
				expect(line.text).toEqual('This is not just a test.')
			})
			test('With end extending beyond text length', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8, 42)).toEqual('a test.')
				line.editText(8, 42, 'still working!')
				expect(line.text).toEqual('This is still working!')
			})
			test('With undefined start', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(undefined, 4)).toEqual('This')
				line.editText(undefined, 4, 'That')
				expect(line.text).toEqual('That is a test.')
			})
			test('With undefined end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(8)).toEqual('a test.')
				line.editText(8, undefined, 'still working!')
				expect(line.text).toEqual('This is still working!')
			})
			test('With undefined start & end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(undefined, undefined)).toEqual('This is a test.')
				line.editText(undefined, undefined, 'Hello world')
				expect(line.text).toEqual('Hello world')
			})
			test('With negative start', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(-5, 14)).toEqual('test')
				line.editText(-5, 14, 'success')
				expect(line.text).toEqual('This is a success.')
			})
			test('With negative end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(5, -6)).toEqual('is a')
				line.editText(5, -6, 'was another')
				expect(line.text).toEqual('This was another test.')
			})
			test('With negative start & end', () => {
				const line = new ExpressiveCodeLine('This is a test.')
				expect(line.text.slice(-6, -1)).toEqual(' test')
				line.editText(-6, -1, 'wesome')
				expect(line.text).toEqual('This is awesome.')
			})
		})
	})
})
