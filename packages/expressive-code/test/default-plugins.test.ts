import { describe, expect, test } from 'vitest'
import { ExpressiveCode, defaultPlugins } from '../src'

describe('defaultPlugins', () => {
	test('Includes all bundled plugins', () => {
		const plugins = defaultPlugins()
		expect(plugins).toMatchObject([
			// Validate plugin names and order
			{ name: 'Shiki' },
			{ name: 'TextMarkers' },
			{ name: 'Frames' },
		])
	})
	test('Allows to pass options to plugins', async () => {
		const ec = new ExpressiveCode({
			plugins: defaultPlugins({
				framesOptions: {
					extractFileNameFromCode: false,
				},
			}),
		})
		const result = await ec.render({
			code: `// test.js`,
			language: 'js',
		})
		expect(result.renderedGroupContents[0].codeBlock.code).toEqual(`// test.js`)
	})
})
