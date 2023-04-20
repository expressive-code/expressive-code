import { describe, expect, test } from 'vitest'
import { ExpressiveCode } from '../src'

describe('ExpressiveCode constructor', () => {
	test('Adds all bundled plugins by default', () => {
		const ec = new ExpressiveCode()
		expect(ec.plugins).toMatchObject([
			// Validate plugin names and order
			{ name: 'Shiki' },
			{ name: 'TextMarkers' },
			{ name: 'Frames' },
		])
	})
	test('Allows disabling bundled plugins by setting them to false', () => {
		const ec = new ExpressiveCode({
			shiki: false,
		})
		expect(ec.plugins).toMatchObject([
			// Validate plugin names and order
			{ name: 'TextMarkers' },
			{ name: 'Frames' },
		])
	})
	test('Allows passing options to bundled plugins', async () => {
		const ec = new ExpressiveCode({
			shiki: false,
			frames: { extractFileNameFromCode: false },
		})
		const result = await ec.render({
			code: `// test.js`,
			language: 'js',
		})
		expect(result.renderedGroupContents[0].codeBlock.code).toEqual(`// test.js`)
	})
})
