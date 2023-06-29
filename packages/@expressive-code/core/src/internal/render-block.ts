import { Element } from 'hast-util-to-html/lib/types'
import { h } from 'hastscript'
import { ExpressiveCodeBlock } from '../common/block'
import { ExpressiveCodePlugin } from '../common/plugin'
import { ExpressiveCodePluginHooks_BeforeRendering, runHooks } from '../common/plugin-hooks'
import { ExpressiveCodeTheme } from '../common/theme'
import { PluginStyles } from './css'
import { GroupContents } from './render-group'
import { renderLineToAst } from './render-line'
import { isBoolean, isHastElement, isHastParent, newTypeError } from './type-checks'
import { ResolvedCoreStyles } from '../common/core-styles'

export async function renderBlock({
	codeBlock,
	groupContents,
	theme,
	locale,
	coreStyles,
	plugins,
}: {
	codeBlock: ExpressiveCodeBlock
	groupContents: GroupContents
	theme: ExpressiveCodeTheme
	locale: string
	coreStyles: ResolvedCoreStyles
	plugins: readonly ExpressiveCodePlugin[]
}) {
	const state: ExpressiveCodeProcessingState = {
		canEditAnnotations: true,
		canEditCode: true,
		canEditMetadata: true,
	}
	codeBlock.state = state

	const blockStyles: PluginStyles[] = []

	const baseContext = {
		codeBlock,
		groupContents,
		theme,
		locale,
		coreStyles,
	}

	const runBeforeRenderingHooks = async (key: keyof ExpressiveCodePluginHooks_BeforeRendering) => {
		await runHooks(key, plugins, async ({ hookFn, plugin }) => {
			await hookFn({
				...baseContext,
				addStyles: (styles: string) => blockStyles.push({ pluginName: plugin.name, styles }),
			})
		})
	}

	// Run hooks for preprocessing metadata and code
	state.canEditCode = false
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
			lineAst: renderLineToAst(line),
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
		blockAst: buildCodeBlockAstFromRenderedLines(renderedAstLines),
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

function buildCodeBlockAstFromRenderedLines(renderedLines: Element[]) {
	return h('pre', h('code', renderedLines))
}

export interface ExpressiveCodeProcessingState {
	canEditCode: boolean
	canEditMetadata: boolean
	canEditAnnotations: boolean
}

export function validateExpressiveCodeProcessingState(state: ExpressiveCodeProcessingState | undefined) {
	const isValid = state && isBoolean(state.canEditCode) && isBoolean(state.canEditMetadata) && isBoolean(state.canEditAnnotations)
	if (!isValid) throw newTypeError('ExpressiveCodeProcessingState', state)
}
