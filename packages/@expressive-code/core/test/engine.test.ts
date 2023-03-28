import { describe, expect, test } from 'vitest'
import { sanitize } from 'hast-util-sanitize'
import { toHtml } from 'hast-util-to-html'
import githubDark from 'shiki/themes/github-dark.json'
import { annotateMatchingTextParts, getHookTestResult, getMultiHookTestResult, getMultiPluginTestResult, getWrapperRenderer, nonArrayValues, nonObjectValues } from './utils'
import { ExpressiveCode } from '../src/common/engine'
import { ExpressiveCodeBlock } from '../src/common/block'
import { groupWrapperScope } from '../src/internal/css'
import { ExpressiveCodeTheme } from '../src/common/theme'

describe('ExpressiveCode', () => {
	describe('render()', () => {
		describe('Validates input', () => {
			test('Throws on invalid input', () => {
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
				invalidValues.forEach((invalidValue) => {
					expect(() => {
						const ec = new ExpressiveCode({ plugins: [] })
						// @ts-expect-error Intentionally passing an invalid value
						ec.render(invalidValue)
					}, `Did not throw on invalid input ${JSON.stringify(invalidValue)}`).toThrow()
				})
			})
			test('Accepts a single ExpressiveCodeBlock instance', () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const codeBlock = new ExpressiveCodeBlock({ code: 'test', language: 'md', meta: '' })
				const result = ec.render(codeBlock)
				expect(result.renderedGroupContents).toHaveLength(1)
				expect(result.renderedGroupContents[0].codeBlock, 'Expected the same block instance to be returned in group contents').toBe(codeBlock)
			})
			test('Accepts a single data object and creates an ExpressiveCodeBlock instance from it', () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const result = ec.render({ code: 'test', language: 'md', meta: '' })
				expect(result.renderedGroupContents).toHaveLength(1)
				const codeBlock = result.renderedGroupContents[0].codeBlock
				expect(codeBlock).toBeInstanceOf(ExpressiveCodeBlock)
				expect(codeBlock.code).toEqual('test')
			})
			test('Accepts multiple ExpressiveCodeBlock instances', () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const codeBlocks = ['test1', 'test2', 'test3'].map((code) => new ExpressiveCodeBlock({ code, language: 'md', meta: '' }))
				const result = ec.render(codeBlocks)
				expect(result.renderedGroupContents).toHaveLength(codeBlocks.length)
				codeBlocks.forEach((codeBlock, i) => {
					expect(result.renderedGroupContents[i].codeBlock, 'Expected the same block instances to be returned in group contents').toBe(codeBlock)
				})
			})
			test('Accepts multiple data objects and creates ExpressiveCodeBlock instances from them', () => {
				const ec = new ExpressiveCode({ plugins: [] })
				const dataObjects = ['test1', 'test2', 'test3'].map((code) => ({ code, language: 'md', meta: '' }))
				const result = ec.render(dataObjects)
				expect(result.renderedGroupContents).toHaveLength(dataObjects.length)
				dataObjects.forEach((dataObject, i) => {
					expect(result.renderedGroupContents[i].codeBlock.code, 'Expected the created block instance to contain the input code').toEqual(dataObject.code)
				})
			})
		})
		describe('Returns the rendered code block AST', () => {
			test('Plain code block', () => {
				const { renderedBlockAst } = getMultiPluginTestResult({ plugins: [] })
				const html = toHtml(sanitize(renderedBlockAst, {}))
				expect(html).toEqual('<pre><code><div>Example code...</div><div>...with two lines!</div></code></pre>')
			})
			test('Code block with inline annotation', () => {
				const searchTerm = 'two '
				const { renderedBlockAst } = getHookTestResult('annotateCode', ({ codeBlock }) => {
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
			test('Default theme (github-dark)', () => {
				let extractedTheme: ExpressiveCodeTheme | undefined
				getHookTestResult('annotateCode', ({ theme }) => {
					extractedTheme = { ...theme }
				})
				if (!extractedTheme) throw new Error('Expected theme to be defined')

				expect(extractedTheme.name).toEqual('github-dark')
				expect(extractedTheme.colors['editor.foreground']).toEqual(githubDark.colors['editor.foreground'].toLowerCase())
				expect(extractedTheme.colors['editor.background']).toEqual(githubDark.colors['editor.background'].toLowerCase())
			})
		})
		describe('Returns all CSS styles added by plugins', () => {
			test('Single hook, non-duplicate styles', () => {
				const { styles } = getHookTestResult('annotateCode', ({ codeBlock, addStyles }) => {
					annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
					addStyles('del { color: red; }')
				})
				// Expect the returned style to be scoped
				expect(styles).toEqual(new Set([`${groupWrapperScope} del { color: red; }`]))
			})
			test('Single hook, duplicate styles', () => {
				const { styles } = getHookTestResult('annotateCode', ({ codeBlock, addStyles }) => {
					annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
					addStyles('del { color: red; }')
					addStyles('ins { color: green; }')
					addStyles('del { color: red; }')
				})
				expect(styles).toEqual(
					new Set([
						// Expect deduplicated and scoped styles
						`${groupWrapperScope} del { color: red; }`,
						`${groupWrapperScope} ins { color: green; }`,
					])
				)
			})
			test('Multiple hooks, duplicate styles', () => {
				const { styles } = getMultiHookTestResult({
					hooks: {
						preprocessMetadata: ({ codeBlock, addStyles }) => {
							annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
							addStyles('del { color: red; }')
							addStyles('ins { color: green; }')
							addStyles('del { color: red; }')
						},
						postprocessRenderedBlockGroup: ({ addStyles }) => {
							addStyles('ins { color: green; }')
							addStyles('a { color: blue; }')
							addStyles('del { color: red; }')
						},
					},
				})
				expect(styles).toEqual(
					new Set([
						// Expect deduplicated and scoped styles
						`${groupWrapperScope} del { color: red; }`,
						`${groupWrapperScope} ins { color: green; }`,
						`${groupWrapperScope} a { color: blue; }`,
					])
				)
			})
			test('Allows global CSS by targeting :root, html and body', () => {
				const { styles } = getHookTestResult('annotateCode', ({ codeBlock, addStyles }) => {
					annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
					addStyles(':root, html, body { --ec-del-text: red; }')
					addStyles('del { color: var(--ec-del-text); }')
				})
				expect(styles).toEqual(
					new Set([
						// Expect some selectors not to be scoped
						':root, html, body { --ec-del-text: red; }',
						// Expect the non-root style to be scoped
						`${groupWrapperScope} del { color: var(--ec-del-text); }`,
					])
				)
			})
		})
	})
})
