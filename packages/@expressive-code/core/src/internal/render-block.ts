import type { Element } from '../hast'
import type { ExpressiveCodeHookContext, ExpressiveCodeHookContextBase, ExpressiveCodePluginHooks_BeforeRendering } from '../common/plugin-hooks'
import type { ExpressiveCodeBlock } from '../common/block'
import type { ExpressiveCodePlugin } from '../common/plugin'
import type { GutterElement } from '../common/gutter'
import type { PluginStyles } from './css'
import { addClassNames, h, setInlineStyle } from '../hast'
import { PluginGutterElement, getRenderEmptyLineFn, renderLineToAst } from './render-line'
import { isBoolean, isHastElement, newTypeError } from './type-checks'
import { AnnotationRenderPhaseOrder } from '../common/annotation'
import { runHooks } from './run-hooks'
import { handleAnnotationComments } from './handle-annotation-comments'

export async function renderBlock({
	codeBlock,
	groupContents,
	locale,
	config,
	plugins,
	cssVar,
	cssVarName,
	styleVariants,
}: {
	plugins: readonly ExpressiveCodePlugin[]
} & ExpressiveCodeHookContextBase) {
	const state: ExpressiveCodeProcessingState = {
		canEditAnnotations: true,
		canEditCode: true,
		canEditLanguage: true,
		canEditMetadata: true,
	}
	codeBlock.state = state

	const blockStyles: PluginStyles[] = []
	const gutterElements: PluginGutterElement[] = []

	const runHooksContext = {
		plugins,
		config,
	}
	const baseContext: Omit<ExpressiveCodeHookContext, 'addStyles' | 'addGutterElement'> = {
		codeBlock,
		groupContents,
		locale,
		config,
		cssVar,
		cssVarName,
		styleVariants,
	}

	const runBeforeRenderingHooks = async (key: keyof ExpressiveCodePluginHooks_BeforeRendering) => {
		await runHooks(key, runHooksContext, async ({ hookFn, plugin }) => {
			await hookFn({
				...baseContext,
				addStyles: (styles: string) => blockStyles.push({ pluginName: plugin.name, styles }),
				addGutterElement: (gutterElement: GutterElement) => {
					if (!gutterElement || typeof gutterElement !== 'object') throw newTypeError('object', gutterElement, 'gutterElement')
					if (typeof gutterElement.renderLine !== 'function') throw newTypeError('"function" type', typeof gutterElement.renderLine, 'gutterElement.renderLine')
					if (gutterElement.renderPhase && AnnotationRenderPhaseOrder.indexOf(gutterElement.renderPhase) === -1)
						throw newTypeError('AnnotationRenderPhase', gutterElement.renderPhase, 'gutterElement.renderPhase')
					gutterElements.push({ pluginName: plugin.name, gutterElement })
				},
			})
		})
	}

	// Run hooks for preprocessing metadata and code
	state.canEditCode = false
	await runBeforeRenderingHooks('preprocessLanguage')
	state.canEditLanguage = false
	// Apply default props to the code block now that the language is fixed
	applyDefaultProps(codeBlock, config)
	// Continue with the next hooks
	await runBeforeRenderingHooks('preprocessMetadata')
	state.canEditCode = true
	await runBeforeRenderingHooks('preprocessCode')

	// Parse annotation comments in the code and run registered handlers
	await handleAnnotationComments({ codeBlock, plugins, config })

	// Run hooks for processing & finalizing the code
	await runBeforeRenderingHooks('performSyntaxAnalysis')
	await runBeforeRenderingHooks('postprocessAnalyzedCode')
	state.canEditCode = false

	// Run hooks for annotating the code
	await runBeforeRenderingHooks('annotateCode')
	await runBeforeRenderingHooks('postprocessAnnotations')
	state.canEditMetadata = false
	state.canEditAnnotations = false

	// Render lines to AST and run rendering hooks
	const lines = codeBlock.getLines()
	const renderedAstLines: Element[] = []
	const renderEmptyLine = getRenderEmptyLineFn({ gutterElements, ...baseContext })
	const { wrap = false, preserveIndent = true, hangingIndent = 0 } = codeBlock.props

	type ClassNames = string | string[]
	const blockClasses: ClassNames[] = []
	const addClassesToRenderedBlock = (classNames: ClassNames) => blockClasses.push(classNames)
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex]
		// Render the current line to an AST and wrap it in an object that can be passed
		// through all hooks, allowing plugins to edit or completely replace the AST
		const lineClasses: ClassNames[] = []
		const addClassesToRenderedLine = (classNames: ClassNames) => lineClasses.push(classNames)
		const lineRenderData = {
			lineAst: renderLineToAst({
				line,
				lineIndex,
				gutterElements,
				addClassesToRenderedLine,
				addClassesToRenderedBlock,
				...baseContext,
			}),
		}
		// Add indent information if wrapping is enabled and the configuration
		// either requests preserving indent or rendering a hanging indent
		if (wrap && (preserveIndent || hangingIndent > 0)) {
			const baseIndent = preserveIndent ? line.text.match(/^\s*/)?.[0].length ?? 0 : 0
			const indent = baseIndent + hangingIndent
			if (indent > 0) setInlineStyle(lineRenderData.lineAst, '--ecIndent', `${indent}ch`)
		}
		// Apply additional classes to the line element (if any)
		lineClasses.forEach((classNames) => addClassNames(lineRenderData.lineAst, classNames))
		// Allow plugins to modify or even completely replace the AST
		await runHooks('postprocessRenderedLine', runHooksContext, async ({ hookFn, plugin }) => {
			await hookFn({
				...baseContext,
				addStyles: (styles: string) => blockStyles.push({ pluginName: plugin.name, styles }),
				line,
				lineIndex,
				renderData: lineRenderData,
				renderEmptyLine,
			})
			if (!isHastElement(lineRenderData.lineAst)) {
				throw newTypeError('hast Element', lineRenderData.lineAst, 'lineAst')
			}
		})
		renderedAstLines.push(lineRenderData.lineAst)
	}

	// Combine rendered lines into a block AST and wrap it in an object that can be passed
	// through all hooks, allowing plugins to edit or completely replace the AST
	const blockRenderData = {
		blockAst: buildCodeBlockAstFromRenderedLines(codeBlock, renderedAstLines),
	}
	// Apply additional classes to the block element (if any)
	blockClasses.forEach((classNames) => addClassNames(blockRenderData.blockAst, classNames))
	await runHooks('postprocessRenderedBlock', runHooksContext, async ({ hookFn, plugin }) => {
		await hookFn({
			...baseContext,
			addStyles: (styles: string) => blockStyles.push({ pluginName: plugin.name, styles }),
			renderData: blockRenderData,
			renderEmptyLine,
		})
		if (!isHastElement(blockRenderData.blockAst)) {
			throw newTypeError('hast Element', blockRenderData.blockAst, 'blockAst')
		}
	})

	return {
		renderedBlockAst: blockRenderData.blockAst,
		blockStyles,
	}
}

function buildCodeBlockAstFromRenderedLines(codeBlock: ExpressiveCodeBlock, renderedLines: Element[]) {
	const preProperties = { dataLanguage: codeBlock.language || 'plaintext' }
	const preElement = h('pre', preProperties, h('code', renderedLines))
	if (codeBlock.props.wrap) {
		const maxLineLength = codeBlock.getLines().reduce((max, line) => Math.max(max, line.text.length), 0)
		addClassNames(preElement, 'wrap')
		setInlineStyle(preElement, '--ecMaxLine', `${maxLineLength}ch`)
	}
	return preElement
}

function applyDefaultProps(codeBlock: ExpressiveCodeBlock, config: ExpressiveCodeHookContextBase['config']) {
	// Build default props by merging the base defaults with the language-specific overrides
	const { overridesByLang = {}, ...baseDefaults } = config.defaultProps
	const mergedDefaults = { ...baseDefaults }
	Object.keys(overridesByLang).forEach((key) => {
		const langs = key.split(',').map((lang) => lang.trim())
		if (langs.includes(codeBlock.language)) {
			Object.assign(mergedDefaults, overridesByLang[key])
		}
	})
	// Apply the merged default values to undefined code block props
	const defaultKeys = Object.keys(mergedDefaults) as (keyof ExpressiveCodeBlock['props'])[]
	const undefinedValueKeys = defaultKeys.filter((key) => codeBlock.props[key] === undefined)
	Object.assign(codeBlock.props, Object.fromEntries(undefinedValueKeys.map((key) => [key, mergedDefaults[key]])))
}

export interface ExpressiveCodeProcessingState {
	canEditCode: boolean
	canEditLanguage: boolean
	canEditMetadata: boolean
	canEditAnnotations: boolean
}

export function validateExpressiveCodeProcessingState(state: ExpressiveCodeProcessingState | undefined) {
	const isValid =
		state &&
		// Expect all properties to be defined and booleans
		isBoolean(state.canEditCode) &&
		isBoolean(state.canEditLanguage) &&
		isBoolean(state.canEditMetadata) &&
		isBoolean(state.canEditAnnotations)
	if (!isValid) throw newTypeError('ExpressiveCodeProcessingState', state)
}
