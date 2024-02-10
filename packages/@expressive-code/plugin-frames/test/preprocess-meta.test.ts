import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginFrames } from '../src'

describe('Handles invalid options', () => {
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
