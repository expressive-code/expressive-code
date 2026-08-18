import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '@expressive-code/core'
import type { Element } from '@expressive-code/core/hast'
import { select } from '@expressive-code/core/hast'
import { renderAndOutputHtmlSnapshot, buildThemeFixtures, loadTestThemes } from '@internal/test-utils'
import { pluginFrames } from '../src'

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

	test('Host projects can provide localized copy button text for new locales', async () => {
		const engine = new ExpressiveCodeEngine({
			themes,
			plugins: [
				pluginFrames({
					texts: {
						vi: {
							copyButtonTooltip: 'Sao chép vào bộ nhớ tạm',
							copyButtonCopied: 'Đã sao chép!',
						},
					},
				}),
			],
		})
		const { renderedGroupAst } = await engine.render({
			code: exampleTerminalCode,
			language: 'shell',
			locale: 'vi',
		})

		validateBlockAst({
			renderedGroupAst,
			codeToCopy: exampleTerminalCodeWithoutComments,
			tooltip: 'Đã sao chép!',
			title: 'Sao chép vào bộ nhớ tạm',
		})
	})

	test('Host projects can override localized copy button text', async () => {
		const engine = new ExpressiveCodeEngine({
			themes,
			plugins: [
				pluginFrames({
					texts: {
						de: {
							copyButtonTooltip: 'Aus dem Blog kopieren',
							copyButtonCopied: 'Vom Blog kopiert!',
						},
					},
				}),
			],
		})
		const { renderedGroupAst } = await engine.render({
			code: exampleTerminalCode,
			language: 'shell',
			locale: 'de',
		})

		validateBlockAst({
			renderedGroupAst,
			codeToCopy: exampleTerminalCodeWithoutComments,
			tooltip: 'Vom Blog kopiert!',
			title: 'Aus dem Blog kopieren',
		})
	})
})

function validateBlockAst({ renderedGroupAst, codeToCopy, title, tooltip }: { renderedGroupAst: Element; codeToCopy: string; title?: string; tooltip?: string }) {
	// Expect the pre element to be followed by the copy button
	const copyButton = select('pre + .copy button', renderedGroupAst)
	expect(copyButton).toBeTruthy()

	// Expect the copy button to contain a data attribute with the correct code to copy
	const actualCode = copyButton?.properties?.dataCode?.toString().replace(/\u007f/g, '\n')
	expect(actualCode).toBe(codeToCopy)
	if (title) expect(copyButton?.properties?.title).toBe(title)
	if (tooltip) expect(copyButton?.properties?.dataCopied).toBe(tooltip)
}
