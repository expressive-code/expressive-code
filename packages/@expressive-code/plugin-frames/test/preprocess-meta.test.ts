import { describe, expect, test } from 'vitest'
import { ExpressiveCode } from '@expressive-code/core'
import { frames } from '../src'

describe('Extracts known attributes from meta string', () => {
	test('`title` attribute', () => {
		const singleQuoted = getMetaResult("something title='Hello world' 'else'")
		expect(singleQuoted.meta).toEqual("something 'else'")

		const doubleQuoted = getMetaResult('twoslash title="Hello world"')
		expect(doubleQuoted.meta).toEqual('twoslash')
	})
	test('`@title` attribute', () => {
		const singleQuoted = getMetaResult("something @title='Hello world' 'else'")
		expect(singleQuoted.meta).toEqual("something 'else'")

		const doubleQuoted = getMetaResult('twoslash @title="Hello world"')
		expect(doubleQuoted.meta).toEqual('twoslash')
	})
})

function getMetaResult(input: string) {
	// Create frames plugin
	const plugin = frames()

	// Create an Expressive Code instance with our plugin
	// and use it to process the test code
	const ec = new ExpressiveCode({
		plugins: [plugin],
	})
	const data = {
		code: 'This is some *markdown* sample text.',
		language: 'md',
		meta: input,
	}
	const { codeBlock } = ec.processCode(data)

	return {
		meta: codeBlock.meta,
	}
}
