import { describe, expect, test } from 'vitest'
import { ExpressiveCode, ExpressiveCodePlugin } from '../src'

describe('ExpressiveCode constructor', () => {
	const onlyDefault = (plugins: readonly ExpressiveCodePlugin[]) =>
		plugins.filter((plugin) => {
			return ['Shiki', 'TextMarkers', 'Frames'].includes(plugin.name)
		})
	test('Adds all bundled plugins by default', () => {
		const ec = new ExpressiveCode()
		expect(onlyDefault(ec.plugins)).toMatchObject([
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
		expect(onlyDefault(ec.plugins)).toMatchObject([
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
	test('Provides access to styleOverrides settings contributed by default plugins', () => {
		new ExpressiveCode({
			styleOverrides: {
				frames: {
					editorBackground: 'blue',
				},
			},
		})
	})
})
