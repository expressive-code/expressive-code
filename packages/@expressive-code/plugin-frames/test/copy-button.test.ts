import { describe, expect, test } from 'vitest'
import type { Element } from '@expressive-code/core/hast'
import { select } from '@expressive-code/core/hast'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, loadTestThemes } from '@internal/test-utils'
import { pluginFrames } from '../src'
import { pluginTextMarkers } from '../../plugin-text-markers'

const exampleTerminalCode = `
# Install dev dependencies
pnpm add --save-dev expressive-code some-other-package yet-another-package

# And a regular one
pnpm add one-more-package
`.trim()

const exampleTerminalCodeWithoutComments = `
pnpm add --save-dev expressive-code some-other-package yet-another-package
pnpm add one-more-package
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

const exampleDeletedCode = `
def f(n: int) -> int:
    if n == 0 or n == 1:
        # FibonacciLucas sequence
        return n
        return 2 if n == 0 else 1
    return f(n - 2) + f(n - 1)
`.trim()

const exampleDeletedCodeAfterDeletions = `
def f(n: int) -> int:
    if n == 0 or n == 1:
        # Lucas sequence
        return 2 if n == 0 else 1
    return f(n - 2) + f(n - 1)
`.trim()

describe('Allows removing deleted code from frames', async () => {
	const themes = await loadTestThemes()

	test('Deleted code is not removed by default', async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleDeletedCode,
				language: 'py',
				meta: 'del="Fibonacci" ins="Lucas" del={4} ins={5}',
				plugins: [pluginFrames(), pluginTextMarkers()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						codeToCopy: exampleDeletedCode,
					})
				},
			}),
		})
	})
	test('Deleted code can be removed through options', async ({ task: { name: testName } }) => {
		await renderAndOutputHtmlSnapshot({
			testName,
			testBaseDir: __dirname,
			fixtures: buildThemeFixtures(themes, {
				code: exampleDeletedCode,
				language: 'py',
				meta: 'del="Fibonacci" ins="Lucas" del={4} ins={5}',
				plugins: [pluginFrames({ removeDeletedTextWhenCopying: true }), pluginTextMarkers()],
				blockValidationFn: ({ renderedGroupAst }) => {
					validateBlockAst({
						renderedGroupAst,
						codeToCopy: exampleDeletedCodeAfterDeletions,
					})
				},
			}),
		})
	})
})

function validateBlockAst({ renderedGroupAst, codeToCopy }: { renderedGroupAst: Element; codeToCopy: string }) {
	// Expect the pre element to be followed by the copy button
	const copyButton = select('pre + .copy button', renderedGroupAst)
	expect(copyButton).toBeTruthy()

	// Expect the copy button to contain a data attribute with the correct code to copy
	const actualCode = copyButton?.properties?.dataCode?.toString().replace(/\u007f/g, '\n')
	expect(actualCode).toBe(codeToCopy)
}
