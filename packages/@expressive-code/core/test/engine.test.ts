import { describe, expect, test } from 'vitest'
import { sanitize } from 'hast-util-sanitize'
import { ExpressiveCode, ExpressiveCodeProcessingState } from '../src/common/engine'
import { ExpressiveCodeHook, ExpressiveCodePlugin, ExpressiveCodePluginHookName, ExpressiveCodePluginHooks } from '../src/common/plugin'
import { expectToWorkOrThrow, getWrapperRenderer, testRender } from './utils'
import { toHtml } from 'hast-util-to-html'

describe('ExpressiveCode', () => {
	describe('processCode()', () => {
		describe('Calls hooks with the correct processing state', () => {
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
			test.each(testCases)('%s', (hookName, expectedCallCount, state) => {
				// Ensure that the code block's state property contains the expected data
				let actualCallCount = 0
				getHookTestResult(hookName, ({ codeBlock }) => {
					expect(codeBlock.state).toEqual(state)
					actualCallCount++
				})

				// Expect the hook to have been called the expected number of times
				expect(actualCallCount).toEqual(expectedCallCount)

				// Perform edits of all properties to ensure they work or throw as expected
				expectToWorkOrThrow(state.canEditMetadata, () => testEditingProperty(hookName, 'meta'))
				expectToWorkOrThrow(state.canEditMetadata, () => testEditingProperty(hookName, 'language'))
				expectToWorkOrThrow(state.canEditAnnotations, () => testAddingAnnotation(hookName))
				expectToWorkOrThrow(state.canEditCode, () => testEditingCode(hookName))
			})
		})
		describe('Provides getPluginData() hook context function to plugins', () => {
			describe('Block-scoped plugin data', () => {
				test('Is shared between hooks while processing the same block', () => {
					getMultiHookTestResult({
						hooks: {
							preprocessMetadata: ({ getPluginData }) => {
								const blockData = getPluginData('block', { justInitialized: true })
								blockData.justInitialized = false
							},
							annotateCode: ({ getPluginData }) => {
								const blockData = getPluginData('block', { justInitialized: true })
								expect(blockData.justInitialized).toEqual(false)
							},
						},
					})
				})
				test('Is not shared between different blocks (= block scope)', () => {
					const testPlugin: ExpressiveCodePlugin = {
						name: 'TestPlugin',
						hooks: {
							preprocessMetadata: ({ getPluginData }) => {
								const blockData = getPluginData('block', { counter: 0 })
								// No matter how many blocks were already processed before,
								// blockData should always have restarted from 0 here
								expect(blockData.counter).toEqual(0)
								blockData.counter++
							},
							annotateCode: ({ getPluginData }) => {
								const blockData = getPluginData('block', { counter: 0 })
								expect(blockData.counter).toEqual(1)
							},
						},
					}
					const ec = new ExpressiveCode({
						plugins: [testPlugin],
					})
					const input = {
						code: 'Example code',
						language: 'md',
						meta: 'test',
					}

					// Reuse the same plugin instance for processing three subsequent blocks
					ec.process(input)
					ec.process(input)
					ec.process(input)
				})
				test('Is not shared between plugins', () => {
					const pluginOne: ExpressiveCodePlugin = {
						name: 'PluginOne',
						hooks: {
							preprocessMetadata: ({ getPluginData }) => {
								const blockData = getPluginData('block', { justInitialized: true })
								blockData.justInitialized = false
							},
						},
					}
					const pluginTwo: ExpressiveCodePlugin = {
						name: 'PluginTwo',
						hooks: {
							annotateCode: ({ getPluginData }) => {
								const blockData = getPluginData('block', { justInitialized: true })
								expect(blockData.justInitialized).toEqual(true)
							},
						},
					}
					getMultiPluginTestResult({
						plugins: [pluginOne, pluginTwo],
					})
				})
			})
			describe('Global plugin data', () => {
				test('Is shared between hooks while processing the same block', () => {
					getMultiHookTestResult({
						hooks: {
							preprocessMetadata: ({ getPluginData }) => {
								const blockData = getPluginData('global', { justInitialized: true })
								blockData.justInitialized = false
							},
							annotateCode: ({ getPluginData }) => {
								const blockData = getPluginData('global', { justInitialized: true })
								expect(blockData.justInitialized).toEqual(false)
							},
						},
					})
				})
				test('Is shared between different blocks (= global scope)', () => {
					let expectedProcessedBlocks = 0
					const testPlugin: ExpressiveCodePlugin = {
						name: 'TestPlugin',
						hooks: {
							preprocessMetadata: ({ getPluginData }) => {
								const globalData = getPluginData('global', { processedBlocks: 0 })
								expect(globalData.processedBlocks).toEqual(expectedProcessedBlocks)
								globalData.processedBlocks++
							},
						},
					}
					const ec = new ExpressiveCode({
						plugins: [testPlugin],
					})
					const input = {
						code: 'Example code',
						language: 'md',
						meta: 'test',
					}

					// Reuse the same plugin instance for processing three subsequent blocks
					ec.process(input)
					expectedProcessedBlocks++
					ec.process(input)
					expectedProcessedBlocks++
					ec.process(input)
				})
				test('Is not shared between plugins', () => {
					const pluginOne: ExpressiveCodePlugin = {
						name: 'PluginOne',
						hooks: {
							preprocessMetadata: ({ getPluginData }) => {
								const blockData = getPluginData('global', { justInitialized: true })
								blockData.justInitialized = false
							},
						},
					}
					const pluginTwo: ExpressiveCodePlugin = {
						name: 'PluginTwo',
						hooks: {
							annotateCode: ({ getPluginData }) => {
								const blockData = getPluginData('global', { justInitialized: true })
								expect(blockData.justInitialized).toEqual(true)
							},
						},
					}
					getMultiPluginTestResult({
						plugins: [pluginOne, pluginTwo],
					})
				})
			})
		})
		describe('Returns the rendered code block AST', () => {
			test('Plain code block', () => {
				const { blockAst } = getMultiPluginTestResult({ plugins: [] })
				const html = toHtml(sanitize(blockAst, {}))
				expect(html).toEqual('<pre><code><div>Example code...</div><div>...with two lines!</div></code></pre>')
			})
			test('Code block with inline annotation', () => {
				const searchTerm = 'two '
				const { blockAst } = getHookTestResult('annotateCode', ({ codeBlock }) => {
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
				const html = toHtml(sanitize(blockAst, {}))
				expect(html).toEqual('<pre><code><div>Example code...</div><div>...with <del>two </del>lines!</div></code></pre>')
			})
		})
	})
})

function testEditingProperty(hookName: ExpressiveCodePluginHookName, propertyName: 'meta' | 'language') {
	const { codeBlock, input } = getHookTestResult(hookName, ({ codeBlock }) => {
		codeBlock[propertyName] = `wrapped(${codeBlock[propertyName]})`
	})
	expect(codeBlock[propertyName]).toEqual(`wrapped(${input[propertyName]})`)
}

function testAddingAnnotation(hookName: ExpressiveCodePluginHookName) {
	const testAnnotation = {
		name: 'del',
		render: testRender,
	}
	const { codeBlock } = getHookTestResult(hookName, ({ codeBlock }) => {
		codeBlock.getLine(0)?.addAnnotation(testAnnotation)
	})
	expect(codeBlock.getLine(0)?.getAnnotations()).toMatchObject([testAnnotation])
}

function testEditingCode(hookName: ExpressiveCodePluginHookName) {
	const { codeBlock, input } = getHookTestResult(hookName, ({ codeBlock }) => {
		codeBlock.insertLine(0, 'Prepended line')
	})
	expect(codeBlock.code).toEqual('Prepended line\n' + input.code)
}

function getHookTestResult(hookName: ExpressiveCodePluginHookName, hookFunc: ExpressiveCodeHook) {
	return getMultiHookTestResult({
		hooks: {
			[hookName]: hookFunc,
		},
	})
}

function getMultiHookTestResult({ hooks }: { hooks: ExpressiveCodePluginHooks }) {
	return getMultiPluginTestResult({
		plugins: [
			{
				name: 'TestPlugin',
				hooks,
			},
		],
	})
}

function getMultiPluginTestResult({ plugins }: { plugins: ExpressiveCodePlugin[] }) {
	const ec = new ExpressiveCode({
		plugins,
	})
	const input = {
		code: ['Example code...', '...with two lines!'].join('\n'),
		language: 'md',
		meta: 'test',
	}

	const result = ec.process(input)
	expect(result.groupContents).toHaveLength(1)

	return {
		...result.groupContents[0],
		input,
	}
}
