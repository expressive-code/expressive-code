import { expect } from 'vitest'
import { h } from 'hastscript'
import { AnnotationRenderOptions, AnnotationRenderPhase, ExpressiveCodeAnnotation } from '../src/common/annotation'
import { ExpressiveCodeLine } from '../src/common/line'
import { ExpressiveCodeBlockOptions } from '../src/common/block'
import { ExpressiveCode } from '../src/common/engine'
import { ExpressiveCodePlugin } from '../src/common/plugin'
import { ExpressiveCodePluginHookName, ExpressiveCodeHook, ExpressiveCodePluginHooks } from '../src/common/plugin-hooks'

const nothings = [undefined, null, NaN]
const booleans = [true, false]
const strings = ['', 'true', 'false', '0', '1']
const numbers = [0, 1]

export const nonStringValues = [...nothings, ...booleans, ...numbers, {}, []]
export const nonNumberValues = [...nothings, ...booleans, ...strings, {}, []]
export const nonArrayValues = [...nothings, ...booleans, ...numbers, ...strings, {}]
export const nonObjectValues = [...nothings, ...booleans, ...numbers, ...strings, []]

export async function expectToWorkOrThrow(shouldWork: boolean, testFunc: () => Promise<void>) {
	if (shouldWork) return await expect(testFunc()).resolves.not.toThrow()
	return await expect(testFunc()).rejects.toThrow()
}

export function annotateMatchingTextParts({
	line,
	partsToAnnotate,
	renderPhase,
	selector,
}: {
	line: ExpressiveCodeLine
	partsToAnnotate: string[]
	renderPhase?: AnnotationRenderPhase
	selector?: string
}) {
	// Create annotations for all the given parts
	partsToAnnotate.forEach((partToAnnotate) => {
		// For testing purposes, we only annotate the first match per part
		const columnStart = line.text.indexOf(partToAnnotate)
		if (columnStart === -1) throw new Error(`Failed to add test annotation: The string "${partToAnnotate}" was not found in line text.`)
		const columnEnd = columnStart + partToAnnotate.length
		const newAnnotationIndex = line.getAnnotations().length
		line.addAnnotation({
			name: selector || 'del',
			render: getWrapperRenderer(`${selector || newAnnotationIndex}`),
			...(renderPhase ? { renderPhase } : {}),
			inlineRange: {
				columnStart,
				columnEnd,
			},
		})
	})
}

export function getAnnotatedTextParts(line: ExpressiveCodeLine) {
	const parts: string[] = []
	line.getAnnotations().forEach(({ inlineRange }) => {
		if (inlineRange) {
			parts.push(line.text.slice(inlineRange.columnStart, inlineRange.columnEnd))
		}
	})
	return parts
}

export function cloneAnnotation(annotation: ExpressiveCodeAnnotation) {
	const clone = { ...annotation }
	if (annotation.inlineRange) clone.inlineRange = { ...annotation.inlineRange }
	return clone
}

export function getWrapperRenderer(selector = 'span') {
	return ({ nodesToTransform }: AnnotationRenderOptions) => {
		return nodesToTransform.map((node) => h(selector, [node]))
	}
}

export const testRender = getWrapperRenderer()

export async function getHookTestResult(hookName: ExpressiveCodePluginHookName, hookFunc: ExpressiveCodeHook) {
	return await getMultiHookTestResult({
		hooks: {
			[hookName]: hookFunc,
		},
	})
}

export async function getMultiHookTestResult({ hooks, input }: { hooks: ExpressiveCodePluginHooks; input?: ExpressiveCodeBlockOptions[] }) {
	return await getMultiPluginTestResult({
		plugins: [
			{
				name: 'TestPlugin',
				hooks,
			},
		],
		input,
	})
}

export const defaultBlockOptions = {
	code: ['Example code...', '...with two lines!'].join('\n'),
	language: 'md',
	meta: 'test',
}

export async function getMultiPluginTestResult({ plugins, input = [defaultBlockOptions] }: { plugins: ExpressiveCodePlugin[]; input?: ExpressiveCodeBlockOptions[] }) {
	const ec = new ExpressiveCode({
		plugins,
	})

	const { renderedGroupAst, renderedGroupContents, styles } = await ec.render(input)
	expect(renderedGroupContents).toHaveLength(input.length)

	return {
		renderedGroupAst,
		styles,
		...renderedGroupContents[0],
		input,
	}
}
