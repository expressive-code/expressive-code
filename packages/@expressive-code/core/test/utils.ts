import { expect } from 'vitest'
import type { Schema } from 'hast-util-sanitize'
import { sanitize } from 'hast-util-sanitize'
import type { Element, Parents } from '../src/hast'
import { h, toHtml, addClassName } from '../src/hast'
import { AnnotationBaseOptions, AnnotationRenderOptions, AnnotationRenderPhase, ExpressiveCodeAnnotation } from '../src/common/annotation'
import { ExpressiveCodeLine } from '../src/common/line'
import { ExpressiveCodeBlockOptions } from '../src/common/block'
import { ExpressiveCodeEngine } from '../src/common/engine'
import { ExpressiveCodePlugin } from '../src/common/plugin'
import { ExpressiveCodePluginHookName, ExpressiveCodeHook, ExpressiveCodePluginHooks } from '../src/common/plugin-hooks'

type PropertyDefinition = NonNullable<Schema['attributes']>[string][number]

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
	useFunctionalSyntax = false,
}: {
	line: ExpressiveCodeLine
	partsToAnnotate: string[]
	renderPhase?: AnnotationRenderPhase | undefined
	selector?: string | undefined
	useFunctionalSyntax?: boolean | undefined
}) {
	// Create annotations for all the given parts
	partsToAnnotate.forEach((partToAnnotate) => {
		// For testing purposes, we only annotate the first match per part
		const columnStart = line.text.indexOf(partToAnnotate)
		if (columnStart === -1) throw new Error(`Failed to add test annotation: The string "${partToAnnotate}" was not found in line text.`)
		const columnEnd = columnStart + partToAnnotate.length
		const newAnnotationIndex = line.getAnnotations().length
		if (useFunctionalSyntax) {
			line.addAnnotation({
				render: ({ nodesToTransform }) => nodesToTransform.map((node) => h(`${selector || newAnnotationIndex}`, [node])),
				inlineRange: {
					columnStart,
					columnEnd,
				},
				...(renderPhase ? { renderPhase } : {}),
			})
		} else {
			line.addAnnotation(
				new WrapperAnnotation({
					selector: `${selector || newAnnotationIndex}`,
					inlineRange: {
						columnStart,
						columnEnd,
					},
					...(renderPhase ? { renderPhase } : {}),
				})
			)
		}
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

export class WrapperAnnotation extends ExpressiveCodeAnnotation {
	selector: string

	constructor({ selector = 'span', ...baseOptions }: { selector?: string | undefined } & AnnotationBaseOptions = {}) {
		super(baseOptions)
		this.selector = selector
	}
	render({ nodesToTransform }: AnnotationRenderOptions) {
		return nodesToTransform.map((node) => h(this.selector, [node]))
	}
}

export function classNameAnnotation(addClass: string): ExpressiveCodeAnnotation {
	return {
		render: ({ nodesToTransform }) => {
			nodesToTransform.forEach((node) => addClassName(node as Element, addClass))
			return nodesToTransform
		},
	}
}

export class ClassNameAnnotation extends ExpressiveCodeAnnotation {
	addClass: string

	constructor({ addClass, ...baseOptions }: { addClass: string } & AnnotationBaseOptions) {
		super(baseOptions)
		this.addClass = addClass
	}
	render({ nodesToTransform }: AnnotationRenderOptions) {
		nodesToTransform.forEach((node) => addClassName(node as Element, this.addClass))
		return nodesToTransform
	}
}

export async function getHookTestResult(hookName: ExpressiveCodePluginHookName, hookFunc: ExpressiveCodeHook) {
	return await getMultiHookTestResult({
		hooks: {
			[hookName]: hookFunc,
		},
	})
}

export async function getMultiHookTestResult({ hooks, input }: { hooks: ExpressiveCodePluginHooks; input?: ExpressiveCodeBlockOptions[] | undefined }) {
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

export const defaultInlineCodeOptions: ExpressiveCodeBlockOptions = {
	code: `console.log('hello world')`,
	language: 'js',
	type: 'inline',
}

export const lineCodeHtml = ['<div class="code">Example code...</div>', '<div class="code">...with two lines!</div>']
export const inlineCodeHtml = '<span class="code-inline">console.log(\'hello world\')</span>'

const sanitizedLineClassNames = /^code|code-inline$/
const sanitizedClassNames = /^code|code-inline|ec-container-block|ec-container-inline|ec-container-mixed$/
export function toSanitizedHtml(ast: Parents, options?: { extraAttributes?: PropertyDefinition[] | undefined; includeContainerClasses?: boolean | undefined }) {
	const html = toHtml(
		sanitize(ast, {
			attributes: {
				'*': ['test', 'edited', ['className', options?.includeContainerClasses ? sanitizedClassNames : sanitizedLineClassNames], ...(options?.extraAttributes ?? [])],
				a: ['href'],
			},
			tagNames: null,
		})
	)
	return html.replace(/ class=""/g, '')
}

export async function getMultiPluginTestResult({ plugins, input = [defaultBlockOptions] }: { plugins: ExpressiveCodePlugin[]; input?: ExpressiveCodeBlockOptions[] | undefined }) {
	const engine = new ExpressiveCodeEngine({
		plugins,
		logger: {
			warn: () => undefined,
			error: () => undefined,
		},
	})

	const { renderedGroupAst, renderedGroupContents, styles } = await engine.render(input)
	expect(renderedGroupContents).toHaveLength(input.length)

	return {
		renderedGroupAst,
		styles,
		...renderedGroupContents[0],
		input,
	}
}
