import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '../src/common/engine'
import { ExpressiveCodePlugin } from '../src/common/plugin'
import { ExpressiveCodeBlock } from '../src/common/block'
import { AttachedPluginData } from '../src/common/plugin-data'
import { getMultiHookTestResult, defaultBlockOptions, getMultiPluginTestResult } from './utils'

describe('AttachedPluginData', () => {
	describe('Data attached to code blocks', () => {
		describe('Can be initialized from outside before processing', () => {
			test('By manually creating an ExpressiveCodeBlock instance', async () => {
				const testPluginData = new AttachedPluginData(() => ({ justInitialized: true }))
				const testBlock = new ExpressiveCodeBlock(defaultBlockOptions)
				testPluginData.setFor(testBlock, { justInitialized: false })
				await getMultiHookTestResult({
					input: [testBlock],
					hooks: {
						preprocessMetadata: ({ codeBlock }) => {
							const blockData = testPluginData.getOrCreateFor(codeBlock)
							expect(blockData.justInitialized).toEqual(false)
						},
					},
				})
			})
		})
		test('Is shared between hooks while processing the same block', async () => {
			const testPluginData = new AttachedPluginData(() => ({ justInitialized: true }))
			await getMultiHookTestResult({
				hooks: {
					preprocessMetadata: ({ codeBlock }) => {
						const blockData = testPluginData.getOrCreateFor(codeBlock)
						blockData.justInitialized = false
					},
					annotateCode: ({ codeBlock }) => {
						const blockData = testPluginData.getOrCreateFor(codeBlock)
						expect(blockData.justInitialized).toEqual(false)
					},
				},
			})
		})
		test('Is not shared between different blocks (= block scope)', async () => {
			const testPluginData = new AttachedPluginData(() => ({ counter: 0 }))
			const testPlugin: ExpressiveCodePlugin = {
				name: 'TestPlugin',
				hooks: {
					preprocessMetadata: ({ codeBlock }) => {
						const blockData = testPluginData.getOrCreateFor(codeBlock)
						// No matter how many blocks were already processed before,
						// blockData should always have restarted from 0 here
						expect(blockData.counter).toEqual(0)
						blockData.counter++
					},
					annotateCode: ({ codeBlock }) => {
						const blockData = testPluginData.getOrCreateFor(codeBlock)
						expect(blockData.counter).toEqual(1)
					},
				},
			}
			const engine = new ExpressiveCodeEngine({
				plugins: [testPlugin],
			})
			const input = {
				code: 'Example code',
				language: 'md',
				meta: 'test',
			}

			// Reuse the same plugin instance for processing three subsequent blocks
			await engine.render(input)
			await engine.render(input)
			await engine.render(input)
		})
		test('Is not shared between plugins', async () => {
			const testPluginOneData = new AttachedPluginData(() => ({ justInitialized: true }))
			const testPluginTwoData = new AttachedPluginData(() => ({ justInitialized: true }))
			const pluginOne: ExpressiveCodePlugin = {
				name: 'PluginOne',
				hooks: {
					preprocessMetadata: ({ codeBlock }) => {
						const blockData = testPluginOneData.getOrCreateFor(codeBlock)
						blockData.justInitialized = false
					},
				},
			}
			const pluginTwo: ExpressiveCodePlugin = {
				name: 'PluginTwo',
				hooks: {
					annotateCode: ({ codeBlock }) => {
						const blockData = testPluginTwoData.getOrCreateFor(codeBlock)
						expect(blockData.justInitialized).toEqual(true)
					},
				},
			}
			await getMultiPluginTestResult({
				plugins: [pluginOne, pluginTwo],
			})
		})
	})
	describe('Data attached to groups of code blocks', () => {
		describe('Can be initialized from outside before processing', () => {
			test('By using an onInitGroup handler function', async () => {
				const testPluginData = new AttachedPluginData(() => ({ processedBlocksPlusTen: 0 }))
				// Start with 10 instead of 0 to check if the onInitGroup function was called
				let expectedProcessedBlocksPlusTen = 10
				const testPlugin: ExpressiveCodePlugin = {
					name: 'TestPlugin',
					hooks: {
						preprocessMetadata: ({ groupContents }) => {
							const groupData = testPluginData.getOrCreateFor(groupContents)
							expect(groupData.processedBlocksPlusTen).toEqual(expectedProcessedBlocksPlusTen)
							groupData.processedBlocksPlusTen++
							expectedProcessedBlocksPlusTen++
						},
					},
				}
				const engine = new ExpressiveCodeEngine({
					plugins: [testPlugin],
				})
				const input = {
					code: 'Example code',
					language: 'md',
					meta: 'test',
				}

				// Use the same input to create a group of 3 blocks, render them,
				// and expect the plugin to have access to the same group-scoped data
				await engine.render([input, input, input], {
					onInitGroup: (groupContents) => {
						// Initialize the group data to start at 10
						testPluginData.setFor(groupContents, { processedBlocksPlusTen: 10 })
					},
				})
				expect(expectedProcessedBlocksPlusTen).toEqual(13)
			})
		})
		test('Is shared between hooks while processing the same block', async () => {
			const testPluginData = new AttachedPluginData(() => ({ justInitialized: true }))
			await getMultiHookTestResult({
				hooks: {
					preprocessMetadata: ({ groupContents }) => {
						const groupData = testPluginData.getOrCreateFor(groupContents)
						groupData.justInitialized = false
					},
					annotateCode: ({ groupContents }) => {
						const groupData = testPluginData.getOrCreateFor(groupContents)
						expect(groupData.justInitialized).toEqual(false)
					},
				},
			})
		})
		test('Is shared between blocks while processing the same group (= group scope)', async () => {
			const testPluginData = new AttachedPluginData(() => ({ processedBlocks: 0 }))
			let expectedProcessedBlocks = 0
			const testPlugin: ExpressiveCodePlugin = {
				name: 'TestPlugin',
				hooks: {
					preprocessMetadata: ({ groupContents }) => {
						const groupData = testPluginData.getOrCreateFor(groupContents)
						expect(groupData.processedBlocks).toEqual(expectedProcessedBlocks)
						groupData.processedBlocks++
						expectedProcessedBlocks++
					},
				},
			}
			const engine = new ExpressiveCodeEngine({
				plugins: [testPlugin],
			})
			const input = {
				code: 'Example code',
				language: 'md',
				meta: 'test',
			}

			// Use the same input to create a group of 3 blocks, render them,
			// and expect the plugin to have access to the same group-scoped data
			await engine.render([input, input, input])
			expect(expectedProcessedBlocks).toEqual(3)
		})
		test('Is not shared between blocks in different groups', async () => {
			const testPluginData = new AttachedPluginData(() => ({ processedBlocks: 0 }))
			let expectedProcessedBlocks = 0
			const testPlugin: ExpressiveCodePlugin = {
				name: 'TestPlugin',
				hooks: {
					preprocessMetadata: ({ groupContents }) => {
						const groupData = testPluginData.getOrCreateFor(groupContents)
						expect(groupData.processedBlocks).toEqual(expectedProcessedBlocks)
						groupData.processedBlocks++
						expectedProcessedBlocks++
					},
				},
			}
			const engine = new ExpressiveCodeEngine({
				plugins: [testPlugin],
			})
			const input = {
				code: 'Example code',
				language: 'md',
				meta: 'test',
			}

			// Use the same input to create a group of 2 blocks, render them,
			// and expect the plugin to have access to the same group-scoped data
			// (just like in the previous test)
			await engine.render([input, input])
			expect(expectedProcessedBlocks).toEqual(2)
			// However, now that rendering has finished and we render a new group,
			// expect the group data to be empty again
			expectedProcessedBlocks = 0
			await engine.render(input)
			expect(expectedProcessedBlocks).toEqual(1)
		})
		test('Is not shared between plugins, even inside the same group', async () => {
			const testPluginOneData = new AttachedPluginData(() => ({ justInitialized: true }))
			const pluginOne: ExpressiveCodePlugin = {
				name: 'PluginOne',
				hooks: {
					preprocessMetadata: ({ groupContents }) => {
						const groupData = testPluginOneData.getOrCreateFor(groupContents)
						groupData.justInitialized = false
					},
				},
			}
			const testPluginTwoData = new AttachedPluginData(() => ({ justInitialized: true }))
			const pluginTwo: ExpressiveCodePlugin = {
				name: 'PluginTwo',
				hooks: {
					annotateCode: ({ groupContents }) => {
						const groupData = testPluginTwoData.getOrCreateFor(groupContents)
						expect(groupData.justInitialized).toEqual(true)
					},
				},
			}
			await getMultiPluginTestResult({
				plugins: [pluginOne, pluginTwo],
			})
		})
	})
})
