/*
	Expected outputs:
	- Additional annotations that were created on the codeBlock:
		- These are based on the defined actions:
			- addClasses for line-level targets and the entire code block
			- wrapWith for inline targets and rendered annotation contents
	- Updated code of the codeBlock:
		- Annotation comments without contents are fully removed from the code
		- Annotation comments WITH contents are handled based on the `stripFromCode` setting:
			- If `stripFromCode` is true, the entire annotation comment is removed from the code
			- If `stripFromCode` is false, only the tag is actually removed from the code,
				but the rest of the annotation comment is marked with an annotation that removes
				it during rendering (renders to an empty root element)

	Future extension ideas:
	- For diffs, it might be useful to actually syntax highlight two versions of the code:
		- A "before" version without the "inserted" parts & with the "deleted" ones
		- An "after" version without the "deleted" parts & with the "inserted" ones
	- Basically, any plugin should be able to create multiple versions of the code
		in a hook and merge the results later on
*/

import type { SourceRange, AnnotationComment } from 'annotation-comments'
import { parseAnnotationComments, cleanCode } from 'annotation-comments'
import type { ExpressiveCodeBlock } from '../common/block'
import type { ResolvedExpressiveCodeEngineConfig } from '../common/engine'
import type { ExpressiveCodePlugin } from '../common/plugin'
import type { AnnotationCommentHandler } from '../common/annotation-comments'
import { ExpressiveCodeInlineRange } from '../common/annotation'
import { h } from '../hast'

export type RunCommentHandlersContext = {
	codeBlock: ExpressiveCodeBlock
	plugins: readonly ExpressiveCodePlugin[]
	config: ResolvedExpressiveCodeEngineConfig
}

/*
	annotationCommentHandlers: [
		{
			tagNames: ['del'],
			commentContents: { stripFromCode: false, output: 'betweenLinesBelowTarget' },
			inlineTargets: { wrapWith: 'del' },
			inlineTargetParentLines: { addClasses: 'has-del' },
			fullLineTargets: { addClasses: 'del' },
			parentBlock: { addClasses: 'has-del' },
		}
	],
*/

/**
 * This function is called by the engine between the `preprocessCode` and `performSyntaxAnalysis`
 * hooks to handle all annotation comments in the code block.
 *
 * It uses the `annotation-comments` library to parse the code block for annotation comments
 * matching any tags defined by handlers, and then performs the following actions:
 *
 * Actions focused on the code plaintext:
 * - removes the annotation tag from the code (tags are metadata and not meant for the reader)
 * - removes or replaces annotation comment contents (if any) in the code plaintext
 *   (based on the `preprocessCode` actions for `commentContents`)
 * - removes or replaces other targeted parts in the code plaintext
 *   (based on the `preprocessCode` actions for `inline*` and `fullLine*`)
 * - adds annotations that remove or replace parts in the copied code
 *   (based on the `replaceInCopiedCode` actions for `commentContents`, `inline*` and `fullLine*`)
 *
 * Actions focused on the rendered output:
 * - adds annotations that render comment contents
 *   (based on the `renderLocation` and `renderAs` actions for `commentContents`)
 * - adds rendering-focused annotations to their parts
 *   (based on the `addClasses` and `wrapWith` actions for `inline*`, `fullLine*` and `parentBlock`)
 */
export async function handleAnnotationComments(context: RunCommentHandlersContext) {
	const { codeBlock, plugins, config } = context
	const uniqueErrors = new Set<string>()

	// Parse annotation comments in the code
	const codeLines = codeBlock.code.split('\n')
	const { annotationComments, errorMessages } = parseAnnotationComments({ codeLines })
	errorMessages.forEach((msg) => uniqueErrors.add(`Parsing error: ${msg}`))

	// Phase 1: Code preprocessing
	// * The goal is to perform actions focused on the code plaintext:
	//   - removes the annotation tag from the code (tags are metadata and not meant for the reader)
	//   - removes or replaces annotation comment contents (if any) in the code
	//     (based on the `preprocessCode` actions for `commentContents`)
	//   - removes or replaces other targeted parts in the code plaintext
	//     (based on the `preprocessCode` actions for `inline*` and `fullLine*`)
	//   - adds annotations that remove or replace parts in the copied code
	//     (based on the `replaceInCopiedCode` actions for `commentContents`, `inline*` and `fullLine*`)
	// * The steps taken to reach this goal are the following:

	// Go through all annotation comments that have a known handler. For each such comment:
	// - Remove it from the code (to prevent disturbing syntax highlighting
	//   in case the language doesn't have a supported comment syntax for annotations),
	//   but while doing so:
	//   - capture its contents (if any) and run both the `preprocessCode` and
	//     `replaceInCopiedCode` actions for `commentContents`
	//   - possible outcomes:
	//     - `preprocessCode` = empty:
	//       - `replaceInCopiedCode` = undefined or empty:
	//         --> nothing further needs to be done
	//       - `replaceInCopiedCode` = non-empty:
	//         --> add a ReplaceInCopiedCode annotation that inserts the desired contents
	//     - `preprocessCode` = non-empty:
	//       - add an annotation that contains the contents to be re-added
	//         after syntax highlighting is done
	//       - `replaceInCopiedCode` = non-empty and different from `preprocessCode`:
	//         --> also add the result of the `replaceInCopiedCode` action in the annotation

	// Call preprocessing hooks for all annotation comments with known handlers
	type PreprocessingDataEntry = {
		handler: AnnotationCommentHandler
		contentsForCopiedCode: string[]
	}
	const preprocessingData = new Map<AnnotationComment, PreprocessingDataEntry>()
	for (const comment of annotationComments) {
		const handler = getHandlerByTagName(comment.tag.name, plugins, uniqueErrors)
		if (!handler) return
		const { contents } = comment
		const { replaceInCopiedCode } = handler.commentContents ?? {}
		const contentsForCopiedCode = (contents.length
			? typeof replaceInCopiedCode === 'function'
				? await replaceInCopiedCode({ codeBlock, annotationComment: comment })
				: replaceInCopiedCode
			: undefined) ?? [...contents]
		preprocessingData.set(comment, { handler, contentsForCopiedCode })
	}

	// Step 1: Remove all annotation comments with known handlers from the code
	cleanCode({
		codeLines,
		annotationComments,
		allowCleaning: ({ comment }) => !!getHandlerByTagName(comment.tag.name, plugins, uniqueErrors),
		updateCodeRanges: true,
	})

	// Step 2: Go through all annotation comments that have a known handler again, and:
	for (const annotationComment of annotationComments) {
		const handler = getHandlerByTagName(annotationComment.tag.name, plugins, uniqueErrors)
		if (!handler) continue

		const { contents } = annotationComment
		const { commentContents } = handler

		// Process comment contents (if any)
		if (contents.length) {
			// Handle optional creation of a clipboard version of the comment contents
			const replaceContentsInCopiedCode = commentContents?.replaceInCopiedCode ?? []
			if (replaceContentsInCopiedCode) {
				// Check if the `replaceInCopiedCode` action resolves to non-empty contents
				const contentsForCopiedCode =
					typeof replaceContentsInCopiedCode === 'function' ? await replaceContentsInCopiedCode({ codeBlock, annotationComment }) : replaceContentsInCopiedCode
				if (contentsForCopiedCode.length) {
					// TODO: Add a `ReplaceInCopiedCode` annotation to where the comment was
					// to allow copying the contents with the outer comment syntax
				}
			}
			// Handle optional rendering of the comment contents
			const renderLocation = commentContents?.renderLocation ?? 'none'
			if (renderLocation !== 'none') {
				// TODO: Add an annotation that renders the contents of the comment
			}
		}

		// Now process the ranges targeted by the annotation comment:
		// - Remove or replace targeted parts in the code plaintext
		//   (`preprocessCode` actions for `inline*` and `fullLine*`)
		// - Add annotations that remove or replace other targeted parts in the copied code
		//   (based on the `replaceInCopiedCode` actions for `inline*` and `fullLine*`)
		for (const targetRange of annotationComment.targetRanges) {
			const subranges = splitIntoSingleLineRanges(targetRange, codeBlock)
			if (!subranges.length) {
				uniqueErrors.add(`Failed to locate target range of annotation comment "${annotationComment.tag.rawTag}"`)
				continue
			}
			for (const { lineIndex, inlineRange } of subranges) {
				if (typeof handler.inlineTargets?.wrapWith === 'function') {
					const line = codeBlock.getLine(lineIndex)
					line?.addAnnotation(await handler.inlineTargets?.wrapWith({ annotationComment, codeBlock, line, inlineRange }))
				}
				codeBlock.getLine(lineIndex)?.addAnnotation({
					inlineRange,
					render: ({ nodesToTransform, addClassesToRenderedLine, addClassesToRenderedBlock }) => {
						const transformedNodes = nodesToTransform
						if (inlineRange) {
							const wrapWith = handler.inlineTargets?.wrapWith
							if (handler.inlineTargetParentLines?.addClasses) addClassesToRenderedLine(handler.inlineTargetParentLines.addClasses)
						} else {
							if (handler.fullLineTargets?.addClasses) addClassesToRenderedLine(handler.fullLineTargets.addClasses)
						}
						return transformedNodes
					},
				})
			}
		}
		// TODO: Perform actual work
	}

	// Log any errors we encountered
	if (uniqueErrors.size > 0) {
		config.logger.warn(
			`Encountered code block annotation comment issues in ${
				codeBlock.parentDocument?.sourceFilePath ? `document "${codeBlock.parentDocument?.sourceFilePath}"` : 'markdown/MDX document'
			}:\n${Array.from(uniqueErrors)
				.map((msg) => `- ${msg}`)
				.join('\n')}`
		)
	}

	await Promise.resolve()
}

const cachedHandlers = new WeakMap<readonly ExpressiveCodePlugin[], Map<string, AnnotationCommentHandler | null>>()

function getHandlerByTagName(tagName: string, plugins: RunCommentHandlersContext['plugins'], uniqueErrors: Set<string>) {
	// Try to return a known cached handler first
	let handlers = cachedHandlers.get(plugins)
	if (!handlers) {
		handlers = new Map<string, AnnotationCommentHandler>()
		cachedHandlers.set(plugins, handlers)
	}
	let handler = handlers.get(tagName)
	if (handler === undefined) {
		// No cached handler was found, so try to find one now
		for (const plugin of plugins) {
			for (const pluginHandler of plugin.annotationCommentHandlers ?? []) {
				for (const handlerTagName of pluginHandler.tagNames) {
					if (handlerTagName !== tagName) continue
					if (handler && !pluginHandler.overrideExisting) {
						uniqueErrors.add(
							`Plugin "${plugin.name}" tried to register a handler for tag name "${tagName}" that is already registered by another plugin. Use the \`overrideExisting\` option to replace the existing handler.`
						)
						continue
					}
					handler = pluginHandler
				}
			}
		}
		// Store undefined handlers as null to avoid repeated lookups
		handlers.set(tagName, handler ?? null)
	}
	if (!handler) uniqueErrors.add(`No handler found for tag name "${tagName}"`)
	return handler ?? undefined
}

type SingleLineRange = { lineIndex: number; inlineRange?: ExpressiveCodeInlineRange | undefined }

function splitIntoSingleLineRanges(range: SourceRange, codeBlock: ExpressiveCodeBlock) {
	const ranges: SingleLineRange[] = []
	for (let lineIndex = range.start.line; lineIndex <= range.end.line; lineIndex++) {
		const line = codeBlock.getLine(lineIndex)
		if (!line) continue
		const startColumn = lineIndex === range.start.line ? range.start.column : undefined
		const endColumn = lineIndex === range.end.line ? range.end.column : undefined
		const hasInlineRange = startColumn !== undefined || endColumn !== undefined
		const inlineRange = hasInlineRange ? { columnStart: startColumn ?? 0, columnEnd: endColumn ?? line.text.length } : undefined
		ranges.push({ lineIndex, inlineRange })
	}
	return ranges
}
