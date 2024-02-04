import { describe, expect, test } from 'vitest'
import { Element } from 'hast-util-to-html/lib/types'
import { h } from 'hastscript'
import {
	WrapperAnnotation,
	defaultBlockOptions,
	expectToWorkOrThrow,
	lineCodeHtml,
	getHookTestResult,
	getMultiHookTestResult,
	getMultiPluginTestResult,
	nonObjectValues,
	toSanitizedHtml,
} from './utils'
import { ExpressiveCodePluginHookName } from '../src/common/plugin-hooks'
import { ExpressiveCodeProcessingState } from '../src/internal/render-block'
import { groupWrapperElement } from '../src/internal/css'

describe('Block-level hooks are called with the correct processing state', () => {
	const baseState: ExpressiveCodeProcessingState = {
		canEditMetadata: true,
		canEditCode: true,
		canEditAnnotations: true,
	}
	const readonlyState: ExpressiveCodeProcessingState = {
		canEditMetadata: false,
		canEditCode: false,
		canEditAnnotations: false,
	}
	const testCases: [ExpressiveCodePluginHookName, number, ExpressiveCodeProcessingState][] = [
		['preprocessMetadata', 1, { ...baseState, canEditCode: false }],
		['preprocessCode', 1, baseState],
		['performSyntaxAnalysis', 1, baseState],
		['postprocessAnalyzedCode', 1, baseState],
		['annotateCode', 1, { ...baseState, canEditCode: false }],
		['postprocessAnnotations', 1, { ...baseState, canEditCode: false }],
		['postprocessRenderedLine', 2, { ...readonlyState }],
		['postprocessRenderedBlock', 1, { ...readonlyState }],
	]
	test.each(testCases)('%s', async (hookName, expectedCallCount, state) => {
		// Ensure that the code block's state property contains the expected data
		let actualCallCount = 0
		await getHookTestResult(hookName, ({ codeBlock }) => {
			expect(codeBlock.state).toEqual(state)
			actualCallCount++
		})

		// Expect the hook to have been called the expected number of times
		expect(actualCallCount).toEqual(expectedCallCount)

		// Perform edits of all properties to ensure they work or throw as expected
		await expectToWorkOrThrow(state.canEditMetadata, () => testEditingProperty(hookName, 'meta'))
		await expectToWorkOrThrow(state.canEditMetadata, () => testEditingProperty(hookName, 'language'))
		await expectToWorkOrThrow(state.canEditAnnotations, () => testAddingAnnotation(hookName))
		await expectToWorkOrThrow(state.canEditCode, () => testEditingCode(hookName))
	})
})

describe('Rendering hooks allow post-processing ASTs', () => {
	describe('postprocessRenderedLine', () => {
		test('Can edit line AST', async () => {
			let totalHookCalls = 0
			const { renderedBlockAst } = await getMultiHookTestResult({
				hooks: {
					postprocessRenderedLine: ({ renderData }) => {
						totalHookCalls++
						if (!renderData.lineAst.properties) renderData.lineAst.properties = {}
						renderData.lineAst.properties.test = totalHookCalls
					},
				},
			})
			expect(totalHookCalls).toEqual(2)
			const html = toSanitizedHtml(renderedBlockAst)
			expect(html).toEqual(`<pre><code><div test="1">${lineCodeHtml[0]}</div><div test="2">${lineCodeHtml[1]}</div></code></pre>`)
		})
		test('Can completely replace line AST', async () => {
			let totalHookCalls = 0
			const { renderedBlockAst } = await getMultiHookTestResult({
				hooks: {
					postprocessRenderedLine: ({ renderData }) => {
						totalHookCalls++
						renderData.lineAst = h('div', { test: totalHookCalls }, 'Replaced line')
					},
				},
			})
			expect(totalHookCalls).toEqual(2)
			const html = toSanitizedHtml(renderedBlockAst)
			expect(html).toEqual('<pre><code><div test="1">Replaced line</div><div test="2">Replaced line</div></code></pre>')
		})
		test('Throws on invalid replacement ASTs', async () => {
			const invalidAsts: unknown[] = [
				// Non-object values
				...nonObjectValues,
				// Empty object
				{},
				// Objects that are not valid hast Elements
				{ type: null },
				{ type: 'invalid' },
				{ type: 'doctype' },
				{ type: 'comment' },
				{ type: 'text' },
				// This is a valid hast Parent, but not an Element,
				// so it's not allowed at the line level
				{ type: 'root' },
			]
			for (const invalidAst of invalidAsts) {
				await expect(
					getMultiHookTestResult({
						hooks: {
							postprocessRenderedLine: ({ renderData }) => {
								// @ts-expect-error Intentionally setting an invalid AST
								renderData.lineAst = invalidAst
							},
						},
					}),
					`Did not throw when hook replaced lineAst with ${JSON.stringify(invalidAst)}`
				).rejects.toThrow()
			}
		})
		test('Subsequent hooks see line edits/replacements', async () => {
			let totalHookCalls = 0
			const { renderedBlockAst } = await getMultiPluginTestResult({
				plugins: [
					{
						name: 'EditLinePlugin',
						hooks: {
							postprocessRenderedLine: ({ renderData }) => {
								totalHookCalls++
								if (!renderData.lineAst.properties) renderData.lineAst.properties = {}
								renderData.lineAst.properties.test = totalHookCalls
							},
						},
					},
					{
						name: 'WrapLinePlugin',
						hooks: {
							postprocessRenderedLine: ({ renderData }) => {
								totalHookCalls++
								renderData.lineAst = h('a', { href: `#${totalHookCalls}` }, renderData.lineAst)
							},
						},
					},
					{
						name: 'EditWrappedLinePlugin',
						hooks: {
							postprocessRenderedLine: ({ renderData }) => {
								totalHookCalls++
								if (!renderData.lineAst.properties) renderData.lineAst.properties = {}
								renderData.lineAst.properties.edited = totalHookCalls
							},
						},
					},
				],
			})
			expect(totalHookCalls).toEqual(6)
			const html = toSanitizedHtml(renderedBlockAst)
			expect(html).toEqual(
				[
					`<pre><code>`,
					`<a href="#2" edited="3"><div test="1">${lineCodeHtml[0]}</div></a>`,
					`<a href="#5" edited="6"><div test="4">${lineCodeHtml[1]}</div></a>`,
					`</code></pre>`,
				].join('')
			)
		})
	})
	describe('postprocessRenderedBlock', () => {
		test('Can edit block AST', async () => {
			let totalHookCalls = 0
			const { renderedBlockAst } = await getMultiHookTestResult({
				hooks: {
					postprocessRenderedBlock: ({ renderData }) => {
						totalHookCalls++
						if (!renderData.blockAst.properties) renderData.blockAst.properties = {}
						renderData.blockAst.properties.test = totalHookCalls
					},
				},
			})
			expect(totalHookCalls).toEqual(1)
			const html = toSanitizedHtml(renderedBlockAst)
			expect(html).toEqual(`<pre test="1"><code><div>${lineCodeHtml[0]}</div><div>${lineCodeHtml[1]}</div></code></pre>`)
		})
		test('Can completely replace block AST', async () => {
			let totalHookCalls = 0
			const { renderedBlockAst } = await getMultiHookTestResult({
				hooks: {
					postprocessRenderedBlock: ({ renderData }) => {
						totalHookCalls++
						// Replace block with a div
						renderData.blockAst = h('div', { test: totalHookCalls }, 'I am completely different now!')
					},
				},
			})
			expect(totalHookCalls).toEqual(1)
			const html = toSanitizedHtml(renderedBlockAst)
			expect(html).toEqual('<div test="1">I am completely different now!</div>')
		})
		test('Throws on invalid replacement ASTs', async () => {
			const invalidAsts: unknown[] = [
				// Non-object values
				...nonObjectValues,
				// Empty object
				{},
				// Objects that are not valid hast elements
				{ type: null },
				{ type: 'invalid' },
				{ type: 'doctype' },
				{ type: 'comment' },
				{ type: 'text' },
				// Note that "root" is a valid hast Parent, so it's allowed here
			]
			for (const invalidAst of invalidAsts) {
				await expect(
					getMultiHookTestResult({
						hooks: {
							postprocessRenderedBlock: ({ renderData }) => {
								// @ts-expect-error Intentionally setting an invalid AST
								renderData.blockAst = invalidAst
							},
						},
					}),
					`Did not throw when hook replaced blockAst with ${JSON.stringify(invalidAst)}`
				).rejects.toThrow()
			}
		})
		test('Subsequent hooks see block edits/replacements', async () => {
			let totalHookCalls = 0
			const { renderedBlockAst } = await getMultiPluginTestResult({
				plugins: [
					{
						name: 'EditBlockPlugin',
						hooks: {
							postprocessRenderedBlock: ({ renderData }) => {
								totalHookCalls++
								if (!renderData.blockAst.properties) renderData.blockAst.properties = {}
								renderData.blockAst.properties.test = totalHookCalls
							},
						},
					},
					{
						name: 'WrapBlockPlugin',
						hooks: {
							postprocessRenderedBlock: ({ renderData }) => {
								totalHookCalls++
								renderData.blockAst = h('div', { test: totalHookCalls }, renderData.blockAst)
							},
						},
					},
					{
						name: 'EditWrappedBlockPlugin',
						hooks: {
							postprocessRenderedBlock: ({ renderData }) => {
								totalHookCalls++
								if (!renderData.blockAst.properties) renderData.blockAst.properties = {}
								renderData.blockAst.properties.edited = totalHookCalls
							},
						},
					},
				],
			})
			expect(totalHookCalls).toEqual(3)
			const html = toSanitizedHtml(renderedBlockAst)
			expect(html).toEqual(`<div test="2" edited="3"><pre test="1"><code><div>${lineCodeHtml[0]}</div><div>${lineCodeHtml[1]}</div></code></pre></div>`)
		})
	})
	describe('postprocessRenderedBlockGroup', () => {
		test('Can edit group AST when rendering a single block', async () => {
			let totalHookCalls = 0
			const { renderedGroupAst } = await getMultiHookTestResult({
				hooks: {
					postprocessRenderedBlockGroup: ({ renderData }) => {
						totalHookCalls++
						// Wrap first child block in a figure
						renderData.groupAst.children[0] = h('figure', renderData.groupAst.children[0])
					},
				},
			})
			expect(totalHookCalls).toEqual(1)
			const html = toSanitizedHtml(renderedGroupAst)
			expect(html).toEqual(
				[
					// Start of group wrapper
					`<${groupWrapperElement}>`,
					'<figure>',
					`<pre><code><div>${lineCodeHtml[0]}</div><div>${lineCodeHtml[1]}</div></code></pre>`,
					'</figure>',
					// End of group wrapper
					`</${groupWrapperElement}>`,
				].join('')
			)
		})
		test('Can edit group AST when rendering multiple blocks', async () => {
			let totalHookCalls = 0
			const { renderedGroupAst } = await getMultiHookTestResult({
				input: [defaultBlockOptions, { ...defaultBlockOptions, code: 'Just one line here!' }],
				hooks: {
					postprocessRenderedBlockGroup: ({ renderData }) => {
						totalHookCalls++
						// Wrap each child in a figure
						renderData.groupAst.children.forEach((child, childIndex) => {
							renderData.groupAst.children[childIndex] = h('figure', child)
						})
					},
				},
			})
			expect(totalHookCalls).toEqual(1)
			const html = toSanitizedHtml(renderedGroupAst)
			expect(html).toEqual(
				[
					// Start of group wrapper
					`<${groupWrapperElement}>`,
					// Wrapper added by hook around first child
					'<figure>',
					`<pre><code><div>${lineCodeHtml[0]}</div><div>${lineCodeHtml[1]}</div></code></pre>`,
					'</figure>',
					// Wrapper added by hook around second child
					'<figure>',
					'<pre><code><div><div class="code">Just one line here!</div></div></code></pre>',
					'</figure>',
					// End of group wrapper
					`</${groupWrapperElement}>`,
				].join('')
			)
		})
		test('Cannot replace individual block AST objects', async () => {
			await expect(
				getMultiHookTestResult({
					hooks: {
						postprocessRenderedBlockGroup: ({ renderedGroupContents }) => {
							// @ts-expect-error Try to modify readonly array
							// eslint-disable-next-line @typescript-eslint/no-unsafe-call
							renderedGroupContents.splice(0, 1, h('div', 'This does not work'))
						},
					},
				})
			).rejects.toThrow()
		})
		test('Can completely replace group AST', async () => {
			let totalHookCalls = 0
			const { renderedGroupAst } = await getMultiHookTestResult({
				hooks: {
					postprocessRenderedBlockGroup: ({ renderData }) => {
						totalHookCalls++
						// Replace group with a version wrapped in a details element
						renderData.groupAst = h('details', { test: totalHookCalls }, renderData.groupAst)
					},
				},
			})
			expect(totalHookCalls).toEqual(1)
			const html = toSanitizedHtml(renderedGroupAst)
			expect(html).toEqual(
				[
					// Start of group wrapper (should be untouchable by plugins)
					`<${groupWrapperElement}>`,
					// Wrapper added by hook
					'<details test="1">',
					// Regular code block HTML
					`<pre><code><div>${lineCodeHtml[0]}</div><div>${lineCodeHtml[1]}</div></code></pre>`,
					// End of wrapper added by hook
					'</details>',
					// End of group wrapper
					`</${groupWrapperElement}>`,
				].join('')
			)
		})
		test('Throws on invalid replacement ASTs', async () => {
			const invalidAsts: unknown[] = [
				// Non-object values
				...nonObjectValues,
				// Empty object
				{},
				// Objects that are not valid hast elements
				{ type: null },
				{ type: 'invalid' },
				{ type: 'doctype' },
				{ type: 'comment' },
				{ type: 'text' },
				// Types "element" and "root" are hast Parents, so they are allowed here
			]
			for (const invalidAst of invalidAsts) {
				await expect(
					getMultiHookTestResult({
						hooks: {
							postprocessRenderedBlockGroup: ({ renderData }) => {
								// @ts-expect-error Intentionally setting an invalid AST
								renderData.groupAst = invalidAst
							},
						},
					}),
					`Did not throw when hook replaced groupAst with ${JSON.stringify(invalidAst)}`
				).rejects.toThrow()
			}
		})
		test('Subsequent hooks see group edits/replacements', async () => {
			let totalHookCalls = 0
			const { renderedGroupAst } = await getMultiPluginTestResult({
				plugins: [
					{
						name: 'EditGroupPlugin',
						hooks: {
							postprocessRenderedBlockGroup: ({ renderData }) => {
								totalHookCalls++
								// Wrap first child block in a figure
								renderData.groupAst.children[0] = h('figure', { test: totalHookCalls }, renderData.groupAst.children[0])
							},
						},
					},
					{
						name: 'WrapGroupPlugin',
						hooks: {
							postprocessRenderedBlockGroup: ({ renderData }) => {
								totalHookCalls++
								// Replace group with a version wrapped in root > details
								renderData.groupAst = h(null, h('details', { test: totalHookCalls }, renderData.groupAst))
							},
						},
					},
					{
						name: 'EditWrappedGroupPlugin',
						hooks: {
							postprocessRenderedBlockGroup: ({ renderData }) => {
								totalHookCalls++
								// Set edited property on details element
								const details = renderData.groupAst.children[0] as Element
								details.properties!.edited = totalHookCalls
							},
						},
					},
				],
			})
			expect(totalHookCalls).toEqual(3)
			const html = toSanitizedHtml(renderedGroupAst)
			expect(html).toEqual(
				[
					// Start of group wrapper (should be untouchable by plugins)
					`<${groupWrapperElement}>`,
					// Wrapper added by second hook
					'<details test="2" edited="3">',
					// Figure added by first hook
					'<figure test="1">',
					// Regular code block HTML
					`<pre><code><div>${lineCodeHtml[0]}</div><div>${lineCodeHtml[1]}</div></code></pre>`,
					// End of figure added by first hook
					'</figure>',
					// End of wrapper added by second hook
					'</details>',
					// End of group wrapper
					`</${groupWrapperElement}>`,
				].join('')
			)
		})
	})
})

async function testEditingProperty(hookName: ExpressiveCodePluginHookName, propertyName: 'meta' | 'language') {
	const { codeBlock, input } = await getHookTestResult(hookName, ({ codeBlock }) => {
		codeBlock[propertyName] = `wrapped(${codeBlock[propertyName]})`
	})
	expect(codeBlock[propertyName]).toEqual(`wrapped(${input[0][propertyName] || ''})`)
}

async function testAddingAnnotation(hookName: ExpressiveCodePluginHookName) {
	const testAnnotation = new WrapperAnnotation()
	const { codeBlock } = await getHookTestResult(hookName, ({ codeBlock }) => {
		codeBlock.getLine(0)?.addAnnotation(testAnnotation)
	})
	expect(codeBlock.getLine(0)?.getAnnotations()).toMatchObject([testAnnotation])
}

async function testEditingCode(hookName: ExpressiveCodePluginHookName) {
	const { codeBlock, input } = await getHookTestResult(hookName, ({ codeBlock }) => {
		codeBlock.insertLine(0, 'Prepended line')
	})
	expect(codeBlock.code).toEqual('Prepended line\n' + input[0].code)
}
