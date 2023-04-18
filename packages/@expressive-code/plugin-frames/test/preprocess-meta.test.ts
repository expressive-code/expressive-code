import { describe, expect, test } from 'vitest'
import { ExpressiveCode } from '@expressive-code/core'
import { pluginFrames } from '../src'

describe('Extracts known attributes from meta string', () => {
	test('`title` attribute', async () => {
		const singleQuoted = await getMetaResult("something title='Hello world' 'else'")
		expect(singleQuoted.meta).toEqual("something 'else'")

		const doubleQuoted = await getMetaResult('twoslash title="Hello world"')
		expect(doubleQuoted.meta).toEqual('twoslash')
	})
	test('`@title` attribute', async () => {
		const singleQuoted = await getMetaResult("something @title='Hello world' 'else'")
		expect(singleQuoted.meta).toEqual("something 'else'")

		const doubleQuoted = await getMetaResult('twoslash @title="Hello world"')
		expect(doubleQuoted.meta).toEqual('twoslash')
	})
})

async function getMetaResult(input: string) {
	// Create frames plugin
	const plugin = pluginFrames()

	// Create an Expressive Code instance with our plugin
	// and use it to render the test code
	const ec = new ExpressiveCode({
		plugins: [plugin],
	})
	const data = {
		code: 'This is some *markdown* sample text.',
		language: 'md',
		meta: input,
	}
	const { renderedGroupContents } = await ec.render(data)
	expect(renderedGroupContents).toHaveLength(1)
	const codeBlock = renderedGroupContents[0].codeBlock

	return {
		meta: codeBlock.meta,
	}
}
