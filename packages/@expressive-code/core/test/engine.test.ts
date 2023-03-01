import { describe, expect, test } from 'vitest'
import { ExpressiveCode, ExpressiveCodeProcessingState } from '../src/common/engine'
import { ExpressiveCodeHook, ExpressiveCodePluginHookName, ExpressiveCodePluginHooks } from '../src/common/plugin'
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
	const ec = new ExpressiveCode({
		plugins: [
			{
				name: 'TestPlugin',
				hooks,
			},
		],
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
