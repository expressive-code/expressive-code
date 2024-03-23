import { describe, expect, test } from 'vitest'
import type { Parent } from '@expressive-code/core/hast'
import { select } from '@expressive-code/core/hast'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, loadTestThemes } from '@internal/test-utils'
import { pluginFrames } from '../src'

const exampleTerminalCode = `
# Install dev dependencies
pnpm i --save-dev expressive-code some-other-package yet-another-package

# And a regular one
pnpm i one-more-package
`.trim()

const exampleTerminalCodeWithoutComments = `
pnpm i --save-dev expressive-code some-other-package yet-another-package
pnpm i one-more-package
`.trim()

describe('Allows removing comments from terminal window frames', async () => {
	const themes = await loadTestThemes()

	test('Terminal comments are removed by default', async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleTerminalCode,
				language: 'shell',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						codeToCopy: exampleTerminalCodeWithoutComments,
					})
				},
			}),
		})
	})
	test('Terminal comments can be retained through options', async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleTerminalCode,
				language: 'shell',
				plugins: [pluginFrames({ removeCommentsWhenCopyingTerminalFrames: false })],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						codeToCopy: exampleTerminalCode,
					})
				},
			}),
		})
	})
	test('Comments are not removed from non-terminal frames', async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleTerminalCode,
				language: 'md',
				plugins: [pluginFrames()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						codeToCopy: exampleTerminalCode,
					})
				},
			}),
		})
	})
})

function validateBlockAst({ renderedGroupAst, codeToCopy }: { renderedGroupAst: Parent; codeToCopy: string }) {
	// Expect the pre element to be followed by the copy button
	const copyButton = select('pre + .copy button', renderedGroupAst)
	expect(copyButton).toBeTruthy()

	// Expect the copy button to contain a data attribute with the correct code to copy
	const actualCode = copyButton?.properties?.dataCode?.toString().replace(/\u007f/g, '\n')
	expect(actualCode).toBe(codeToCopy)
}
