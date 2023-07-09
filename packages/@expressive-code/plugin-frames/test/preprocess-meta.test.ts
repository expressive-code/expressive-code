import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginFrames } from '../src'
import { frameTypes } from '../src/utils'

describe('Extracts known attributes from meta string', () => {
	test('title, @title', async () => {
		const keys = ['title', '@title']
		for (const key of keys) {
			const singleQuoted = await getMetaResult(`something ${key}='Hello world' 'else'`)
			expect(singleQuoted.meta).toEqual("something 'else'")
			const doubleQuoted = await getMetaResult(`twoslash ${key}="Hello world"`)
			expect(doubleQuoted.meta).toEqual('twoslash')
		}
	})
	test('frame, frameType, @frame, @frameType', async () => {
		const keys = ['frame', 'frameType', '@frame', '@frameType']
		const values = [
			...frameTypes,
			// Support an empty string as alias for "none"
			'',
		]
		for (const key of keys) {
			for (const value of values) {
				const singleQuoted = await getMetaResult(`something ${key}='${value}' 'else'`)
				expect(singleQuoted.meta).toEqual("something 'else'")

				const doubleQuoted = await getMetaResult(`twoslash ${key}="${value}"`)
				expect(doubleQuoted.meta).toEqual('twoslash')
			}
		}
	})
	test('Throws an error on invalid frame types', async () => {
		const testFunc = async () => {
			await getMetaResult('something frame="totally-invalid" "else"')
		}
		await expect(testFunc()).rejects.toThrowError(/frame type.*totally-invalid/)
	})
})

async function getMetaResult(input: string) {
	// Create frames plugin
	const plugin = pluginFrames()

	// Create an Expressive Code instance with our plugin
	// and use it to render the test code
	const engine = new ExpressiveCodeEngine({
		plugins: [plugin],
	})
	const data = {
		code: 'This is some *markdown* sample text.',
		language: 'md',
		meta: input,
	}
	const { renderedGroupContents } = await engine.render(data)
	expect(renderedGroupContents).toHaveLength(1)
	const codeBlock = renderedGroupContents[0].codeBlock

	return {
		meta: codeBlock.meta,
	}
}
