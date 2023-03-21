import { Element } from 'hast-util-to-html/lib/types'
import { h } from 'hastscript'
import { ExpressiveCodeBlock } from '../common/block'
import { ExpressiveCodePlugin } from '../common/plugin'
import { ExpressiveCodePluginHooks_BeforeRendering, runHooks } from '../common/plugin-hooks'
import { processStyles } from './css'
import { GroupContents } from './render-group'
import { renderLineToAst } from './render-line'
import { isBoolean, isHastElement, isHastParent, newTypeError } from './type-checks'

export function renderBlock({ codeBlock, groupContents, plugins }: { codeBlock: ExpressiveCodeBlock; groupContents: GroupContents; plugins: ExpressiveCodePlugin[] }) {
	const state: ExpressiveCodeProcessingState = {
		canEditAnnotations: true,
		canEditCode: true,
		canEditMetadata: true,
	}
	codeBlock.state = state

	const blockStyles = new Set<string>()

	const baseContext = {
		codeBlock,
		groupContents,
		addStyles: (css: string) => blockStyles.add(processStyles(css)),
	}

	const runBeforeRenderingHooks = (key: keyof ExpressiveCodePluginHooks_BeforeRendering) => {
		runHooks(key, plugins, ({ hookFn }) => {
			hookFn({
				...baseContext,
			})
		})
	}

	// Run hooks for preprocessing metadata and code
	state.canEditCode = false
	runBeforeRenderingHooks('preprocessMetadata')
	state.canEditCode = true
	runBeforeRenderingHooks('preprocessCode')

	// Run hooks for processing & finalizing the code
	runBeforeRenderingHooks('performSyntaxAnalysis')
	runBeforeRenderingHooks('postprocessAnalyzedCode')
	state.canEditCode = false

	// Run hooks for annotating the code
	runBeforeRenderingHooks('annotateCode')
	runBeforeRenderingHooks('postprocessAnnotations')
	state.canEditMetadata = false
	state.canEditAnnotations = false

	// Render lines to AST and run rendering hooks
	const lines = codeBlock.getLines()
	const renderedAstLines = lines.map((line, lineIndex) => {
		// Render the current line to an AST and wrap it in an object that can be passed
		// through all hooks, allowing plugins to edit or completely replace the AST
		const lineRenderData = {
			lineAst: renderLineToAst(line),
		}
		// Allow plugins to modify or even completely replace the AST
		runHooks('postprocessRenderedLine', plugins, ({ hookFn }) => {
			hookFn({
				...baseContext,
				line,
				lineIndex,
				renderData: lineRenderData,
			})
			if (!isHastElement(lineRenderData.lineAst)) {
				throw newTypeError('hast Element', lineRenderData.lineAst, 'lineAst')
			}
		})
		return lineRenderData.lineAst
	})

	// Combine rendered lines into a block AST and wrap it in an object that can be passed
	// through all hooks, allowing plugins to edit or completely replace the AST
	const blockRenderData = {
		blockAst: buildCodeBlockAstFromRenderedLines(renderedAstLines),
	}
	runHooks('postprocessRenderedBlock', plugins, ({ hookFn }) => {
		hookFn({
			...baseContext,
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
