import { describe, expect, test } from 'vitest'
import { sanitize } from 'hast-util-sanitize'
import { toHtml } from 'hast-util-to-html'
import githubDark from 'shiki/themes/github-dark.json'
import githubLight from 'shiki/themes/github-light.json'
import { WrapperAnnotation, getHookTestResult, getMultiPluginTestResult, nonArrayValues, nonObjectValues } from './utils'
import { ExpressiveCodeEngine } from '../src/common/engine'
import { ExpressiveCodeBlock } from '../src/common/block'
import { StyleVariant } from '../src/common/style-variants'

describe('ExpressiveCodeEngine', () => {
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
						const engine = new ExpressiveCodeEngine({ plugins: [] })
						// @ts-expect-error Intentionally passing an invalid value
						await engine.render(invalidValue)
					}, `Did not throw on invalid input ${JSON.stringify(invalidValue)}`).rejects.toThrow()
				}
			})
			test('Accepts a single ExpressiveCodeBlock instance', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const codeBlock = new ExpressiveCodeBlock({ code: 'test', language: 'md', meta: '' })
				const result = await engine.render(codeBlock)
				expect(result.renderedGroupContents).toHaveLength(1)
				expect(result.renderedGroupContents[0].codeBlock, 'Expected the same block instance to be returned in group contents').toBe(codeBlock)
			})
			test('Accepts a single data object and creates an ExpressiveCodeBlock instance from it', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const result = await engine.render({ code: 'test', language: 'md', meta: '' })
				expect(result.renderedGroupContents).toHaveLength(1)
				const codeBlock = result.renderedGroupContents[0].codeBlock
				expect(codeBlock).toBeInstanceOf(ExpressiveCodeBlock)
				expect(codeBlock.code).toEqual('test')
			})
			test('Accepts multiple ExpressiveCodeBlock instances', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const codeBlocks = ['test1', 'test2', 'test3'].map((code) => new ExpressiveCodeBlock({ code, language: 'md', meta: '' }))
				const result = await engine.render(codeBlocks)
				expect(result.renderedGroupContents).toHaveLength(codeBlocks.length)
				codeBlocks.forEach((codeBlock, i) => {
					expect(result.renderedGroupContents[i].codeBlock, 'Expected the same block instances to be returned in group contents').toBe(codeBlock)
				})
			})
			test('Accepts multiple data objects and creates ExpressiveCodeBlock instances from them', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const dataObjects = ['test1', 'test2', 'test3'].map((code) => ({ code, language: 'md', meta: '' }))
				const result = await engine.render(dataObjects)
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
				expect(html).toMatch(new RegExp('<pre(|\\s[^>]+)><code><div>Example code...</div><div>...with two lines!</div></code></pre>'))
			})
			test('Code block with inline annotation', async () => {
				const searchTerm = 'two '
				const { renderedBlockAst } = await getHookTestResult('annotateCode', ({ codeBlock }) => {
					const line = codeBlock.getLine(1)
					if (!line) return
					const index = line.text.indexOf(searchTerm)
					line.addAnnotation(
						new WrapperAnnotation({
							selector: 'del',
							inlineRange: {
								columnStart: index,
								columnEnd: index + searchTerm.length,
							},
						})
					)
				})
				const html = toHtml(sanitize(renderedBlockAst, {}))
				expect(html).toMatch(new RegExp('<pre(|\\s[^>]+)><code><div>Example code...</div><div>...with <del>two </del>lines!</div></code></pre>'))
			})
		})
		describe('Allows plugin hooks to access theme colors', () => {
			test('Default themes (github-dark, github-light)', async () => {
				let extractedStyleVariants: StyleVariant[] = []
				await getHookTestResult('annotateCode', ({ styleVariants }) => {
					extractedStyleVariants = styleVariants
				})
				expect(extractedStyleVariants).toHaveLength(2)
				const extractedDark = extractedStyleVariants[0].theme
				const extractedLight = extractedStyleVariants[1].theme
				if (!extractedDark) throw new Error('Expected dark theme to be defined')
				if (!extractedLight) throw new Error('Expected light theme to be defined')

				expect(extractedDark.name).toEqual('github-dark')
				expect(extractedDark.colors['editor.foreground']).toEqual(githubDark.colors['editor.foreground'].toLowerCase())
				expect(extractedDark.colors['editor.background']).toEqual(githubDark.colors['editor.background'].toLowerCase())
				expect(extractedLight.name).toEqual('github-light')
				expect(extractedLight.colors['editor.foreground']).toEqual(githubLight.colors['editor.foreground'].toLowerCase())
				expect(extractedLight.colors['editor.background']).toEqual(githubLight.colors['editor.background'].toLowerCase())
			})
		})
	})
	describe('getJsModules()', () => {
		test('Returns an empty array if no modules are provided', async () => {
			const engine = new ExpressiveCodeEngine({
				plugins: [
					{
						name: 'TestPlugin',
						hooks: {},
					},
				],
			})
			expect(await engine.getJsModules()).toEqual([])
		})
		describe('Returns the JS modules provided by a plugin', () => {
			test('Supports empty arrays', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: [],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual([])
			})
			test('Supports string arrays', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: ['console.log("Test 1")', 'console.log("Test 2")'],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['console.log("Test 1")', 'console.log("Test 2")'])
			})
			test('Supports module resolver functions', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: ({ styleVariants }) => [`console.log("${styleVariants.length}: ${styleVariants.map((variant) => variant.theme.name).join(', ')}")`],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['console.log("2: github-dark, github-light")'])
			})
		})
		describe('Deduplicates JS modules', () => {
			test('When they contain the same code', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: () => ['export const test = "something"', 'export const test = "something"'],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['export const test = "something"'])
			})
			test('When they only differ in surrounding whitespace', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: () => ['export const test = "something"', '\t\texport const test = "something" '],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['export const test = "something"'])
			})
			test('Also checks across plugins', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin1',
							hooks: {},
							jsModules: () => ['export const test = "something"', 'console.log(test)'],
						},
						{
							name: 'TestPlugin2',
							hooks: {},
							jsModules: () => ['console.log("Success!")', '\texport const test = "something"'],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['export const test = "something"', 'console.log(test)', 'console.log("Success!")'])
			})
		})
	})
})
