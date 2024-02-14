import { Element } from 'hast-util-to-html/lib/types'
import { h } from 'hastscript'
import { ExpressiveCodePlugin } from '../common/plugin'
import { ExpressiveCodeHookContext, ExpressiveCodeHookContextBase, ExpressiveCodePluginHooks_BeforeRendering, runHooks } from '../common/plugin-hooks'
import { PluginStyles } from './css'
import { PluginGutterElement, renderLineToAst } from './render-line'
import { isBoolean, isHastElement, isHastParent, newTypeError } from './type-checks'
import { AnnotationRenderPhaseOrder } from '../common/annotation'
import { ExpressiveCodeBlock } from '../common/block'
import { GutterElement } from '../common/gutter'
import { addClassName, setInlineStyle } from '../helpers/ast'

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
		await runHooks(key, plugins, async ({ hookFn, plugin }) => {
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
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex]
		// Render the current line to an AST and wrap it in an object that can be passed
		// through all hooks, allowing plugins to edit or completely replace the AST
		const lineRenderData = {
			lineAst: renderLineToAst({ line, gutterElements, ...baseContext }),
		}
		// Add indent information if wrapping is enabled and preserveIndent has not been disabled
		if (codeBlock.props.wrap && codeBlock.props.preserveIndent !== false) {
			const indent = line.text.match(/^\s*/)?.[0].length ?? 0
			if (indent > 0) setInlineStyle(lineRenderData.lineAst, '--ecIndent', `${indent}ch`)
		}
		// Allow plugins to modify or even completely replace the AST
		await runHooks('postprocessRenderedLine', plugins, async ({ hookFn, plugin }) => {
			await hookFn({
				...baseContext,
				addStyles: (styles: string) => blockStyles.push({ pluginName: plugin.name, styles }),
				line,
				lineIndex,
				renderData: lineRenderData,
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
	await runHooks('postprocessRenderedBlock', plugins, async ({ hookFn, plugin }) => {
		await hookFn({
			...baseContext,
			addStyles: (styles: string) => blockStyles.push({ pluginName: plugin.name, styles }),
			renderData: blockRenderData,
		})
		if (!isHastParent(blockRenderData.blockAst)) {
			throw newTypeError('hast Parent', blockRenderData.blockAst, 'blockAst')
		}
	})

	return {
		renderedBlockAst: blockRenderData.blockAst,
		blockStyles,
	}
}

function buildCodeBlockAstFromRenderedLines(codeBlock: ExpressiveCodeBlock, renderedLines: Element[]) {
	const preElement = h('pre', { tabindex: 0 }, h('code', renderedLines))
	if (codeBlock.props.wrap) {
		const maxLineLength = codeBlock.getLines().reduce((max, line) => Math.max(max, line.text.length), 0)
		addClassName(preElement, 'wrap')
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
	// Apply the merged defaults to the code block
	const defaultKeys = Object.keys(mergedDefaults) as (keyof ExpressiveCodeBlock['props'])[]
	defaultKeys.forEach((key) => {
		if (codeBlock.props[key] === undefined) codeBlock.props[key] = mergedDefaults[key]
	})
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
