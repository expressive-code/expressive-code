import { describe, expect, test } from 'vitest'
import { sanitize } from 'hast-util-sanitize'
import { toHtml } from 'hast-util-to-html'
import githubDark from 'shiki/themes/github-dark.json'
import { getHookTestResult, getMultiPluginTestResult, getWrapperRenderer, nonArrayValues, nonObjectValues } from './utils'
import { ExpressiveCode } from '../src/common/engine'
import { ExpressiveCodeBlock } from '../src/common/block'
import { ExpressiveCodeTheme } from '../src/common/theme'

describe('ExpressiveCode', () => {
	describe('render()', () => {
		describe('Validates input', () => {
			test('Throws on invalid input', async () => {
				const invalidValues: unknown[] = [
					// Non-array values (including one empty object)
					...nonArrayValues,
					// Arrays containing non-object values
					...nonObjectValues.map((value) => [value]),
					// Data objects with missing properties
					{ code: 'test' },
					{ language: 'test' },
					{ meta: 'test' },
				]
				for (const invalidValue of invalidValues) {
					await expect(async () => {
						const ec = new ExpressiveCode({ plugins: [] })
						// @ts-expect-error Intentionally passing an invalid value
						await ec.render(invalidValue)
					}, `Did not throw on invalid input ${JSON.stringify(invalidValue)}`).rejects.toThrow()
				}
			})
			test('Accepts a single ExpressiveCodeBlock instance', async () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const codeBlock = new ExpressiveCodeBlock({ code: 'test', language: 'md', meta: '' })
				const result = await ec.render(codeBlock)
				expect(result.renderedGroupContents).toHaveLength(1)
				expect(result.renderedGroupContents[0].codeBlock, 'Expected the same block instance to be returned in group contents').toBe(codeBlock)
			})
			test('Accepts a single data object and creates an ExpressiveCodeBlock instance from it', async () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const result = await ec.render({ code: 'test', language: 'md', meta: '' })
				expect(result.renderedGroupContents).toHaveLength(1)
				const codeBlock = result.renderedGroupContents[0].codeBlock
				expect(codeBlock).toBeInstanceOf(ExpressiveCodeBlock)
				expect(codeBlock.code).toEqual('test')
			})
			test('Accepts multiple ExpressiveCodeBlock instances', async () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const codeBlocks = ['test1', 'test2', 'test3'].map((code) => new ExpressiveCodeBlock({ code, language: 'md', meta: '' }))
				const result = await ec.render(codeBlocks)
				expect(result.renderedGroupContents).toHaveLength(codeBlocks.length)
				codeBlocks.forEach((codeBlock, i) => {
					expect(result.renderedGroupContents[i].codeBlock, 'Expected the same block instances to be returned in group contents').toBe(codeBlock)
				})
			})
			test('Accepts multiple data objects and creates ExpressiveCodeBlock instances from them', async () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const dataObjects = ['test1', 'test2', 'test3'].map((code) => ({ code, language: 'md', meta: '' }))
				const result = await ec.render(dataObjects)
				expect(result.renderedGroupContents).toHaveLength(dataObjects.length)
				dataObjects.forEach((dataObject, i) => {
					expect(result.renderedGroupContents[i].codeBlock.code, 'Expected the created block instance to contain the input code').toEqual(dataObject.code)
				})
			})
		})
		describe('Returns the rendered code block AST', () => {
			test('Plain code block', async () => {
				const { renderedBlockAst } = await getMultiPluginTestResult({ plugins: [] })
				const html = toHtml(sanitize(renderedBlockAst, {}))
				expect(html).toEqual('<pre><code><div>Example code...</div><div>...with two lines!</div></code></pre>')
			})
			test('Code block with inline annotation', async () => {
				const searchTerm = 'two '
				const { renderedBlockAst } = await getHookTestResult('annotateCode', ({ codeBlock }) => {
					const line = codeBlock.getLine(1)
					if (!line) return
					const index = line.text.indexOf(searchTerm)
					line.addAnnotation({
						name: 'del',
						render: getWrapperRenderer('del'),
						inlineRange: {
							columnStart: index,
							columnEnd: index + searchTerm.length,
						},
					})
				})
				const html = toHtml(sanitize(renderedBlockAst, {}))
				expect(html).toEqual('<pre><code><div>Example code...</div><div>...with <del>two </del>lines!</div></code></pre>')
			})
		})
		describe('Allows plugin hooks to access theme colors', () => {
			test('Default theme (github-dark)', async () => {
				let extractedTheme: ExpressiveCodeTheme | undefined
				await getHookTestResult('annotateCode', ({ theme }) => {
					extractedTheme = { ...theme }
				})
				if (!extractedTheme) throw new Error('Expected theme to be defined')

				expect(extractedTheme.name).toEqual('github-dark')
				expect(extractedTheme.colors['editor.foreground']).toEqual(githubDark.colors['editor.foreground'].toLowerCase())
				expect(extractedTheme.colors['editor.background']).toEqual(githubDark.colors['editor.background'].toLowerCase())
			})
		})
	})
})
