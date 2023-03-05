import { describe, expect, test } from 'vitest'
import { ExpressiveCode, ExpressiveCodeProcessingState } from '../src/common/engine'
import { ExpressiveCodeHook, ExpressiveCodePlugin, ExpressiveCodePluginHookName, ExpressiveCodePluginHooks } from '../src/common/plugin'
import { expectToWorkOrThrow } from './utils'

describe('ExpressiveCode', () => {
	describe('processCode()', () => {
		describe('Calls hooks with the correct processing state', () => {
			const baseState: ExpressiveCodeProcessingState = {
				canEditMetadata: true,
				canEditCode: true,
				canEditAnnotations: true,
			}
			const testCases: [ExpressiveCodePluginHookName, ExpressiveCodeProcessingState][] = [
				['preprocessMetadata', { ...baseState, canEditCode: false }],
				['preprocessCode', baseState],
				['performSyntaxAnalysis', baseState],
				['postprocessAnalyzedCode', baseState],
				['annotateCode', { ...baseState, canEditCode: false }],
				['postprocessAnnotations', { ...baseState, canEditCode: false }],
			]
			test.each(testCases)('%s', (hookName, state) => {
				// Ensure that the code block's state property contains the expected data
				getHookTestResult(hookName, ({ codeBlock }) => {
					expect(codeBlock.state).toEqual(state)
				})

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
					ec.processCode(input)
					ec.processCode(input)
					ec.processCode(input)
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
					ec.processCode(input)
					expectedProcessedBlocks++
					ec.processCode(input)
					expectedProcessedBlocks++
					ec.processCode(input)
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
		render: () => true,
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
		code: 'Example code',
		language: 'md',
		meta: 'test',
	}

	const result = ec.processCode(input)

	return {
		...result,
		input,
	}
}
