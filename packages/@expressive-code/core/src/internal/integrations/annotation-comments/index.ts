import type { AnnotationComment } from 'annotation-comments'
import type { AnnotationCommentContentCleanup, AnnotationCommentContentCleanupResolver } from '../../../common/annotation-comments'
import type { ExpressiveCodeHookContextBase } from '../../../common/plugin-hooks'
import type { ExpressiveCodeLogger } from '../../../common/logger'
import type { ExpressiveCodePlugin } from '../../../common/plugin'
import type { RenderTransform } from '../../../common/render-transforms'
import { cleanCode, parseAnnotationComments } from 'annotation-comments'
import { applyContentRenderConvenience } from './content-rendering'
import { getDefaultInsertOnDeleteLine, getDefaultInsertPosition, resolveTargets } from './target-resolving'
import type { AnnotationCommentContextBase, RegisteredAnnotationCommentHandler } from './types'

/**
 * Parses and processes annotation comments for a code block.
 *
 * It resolves plugin handlers by tag name, lets handlers register copy/render transforms,
 * and then cleans annotation comment syntax from display code before syntax analysis.
 *
 * Used by the core rendering pipeline during the `preprocessCode` phase in
 * `internal/render-block.ts`.
 */
export async function processAnnotationComments(options: ExpressiveCodeHookContextBase) {
	const { codeBlock, config } = options
	const logger = config.logger
	const handlersByTag = resolveAnnotationCommentHandlers(config.plugins)

	// If no handlers were registered, there is nothing to process
	if (!handlersByTag.size) return

	const parseResult = parseAnnotationComments({
		codeLines: codeBlock.getLines().map((line) => line.text),
	})

	parseResult.errorMessages.forEach((errorMessage) => {
		logger.warn(`Annotation comments: ${errorMessage}`)
	})

	if (!parseResult.annotationComments.length) return

	const commentsToClean = new Set<AnnotationComment>()
	const removeDisplayContent = new Map<AnnotationComment, boolean>()

	for (const annotationComment of parseResult.annotationComments) {
		// Always clean parser-level control comments from display code
		if (annotationComment.tag.name === 'ignore-tags') {
			commentsToClean.add(annotationComment)
			removeDisplayContent.set(annotationComment, true)
			continue
		}

		const registeredHandler = handlersByTag.get(annotationComment.tag.name)
		if (!registeredHandler) continue

		const annotationLine = codeBlock.getLine(annotationComment.commentRange.start.line)
		if (!annotationLine) continue
		const targets = resolveTargets(annotationComment, codeBlock)
		const contentLines = [...annotationComment.contents]
		const content = {
			lines: contentLines,
			text: contentLines.join('\n'),
		}
		const baseContext: AnnotationCommentContextBase = {
			...options,
			annotationComment,
			targets,
			content,
		}
		const defaultInsertPosition = getDefaultInsertPosition(annotationComment)
		const defaultInsertOnDeleteLine = getDefaultInsertOnDeleteLine(annotationComment)
		const addRenderTransform = (renderTransform: RenderTransform) => {
			annotationLine.addRenderTransform({
				...renderTransform,
				position: renderTransform.position ?? defaultInsertPosition,
				onDeleteLine: renderTransform.onDeleteLine ?? defaultInsertOnDeleteLine,
			})
		}

		const displayCleanup = await resolveContentCleanup(registeredHandler.handler.content?.displayCode, baseContext)
		const copyCleanup = await resolveContentCleanup(registeredHandler.handler.content?.copyCode, baseContext)
		commentsToClean.add(annotationComment)
		removeDisplayContent.set(annotationComment, displayCleanup === 'remove')

		await applyContentRenderConvenience({
			...registeredHandler,
			context: baseContext,
			logger,
		})

		applyContentCopyConvenience({
			...registeredHandler,
			context: baseContext,
			displayCleanup,
			logger,
			copyCleanup,
			annotationComments: parseResult.annotationComments,
		})

		try {
			await registeredHandler.handler.handle({
				...baseContext,
				annotationLine,
				addRenderTransform,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Plugin "${registeredHandler.pluginName}" failed to handle annotation comment tag "${annotationComment.tag.name}". Error message: ${message}`, {
				cause: error,
			})
		}
	}

	if (!commentsToClean.size) return

	const cleanedCodeLines = codeBlock.getLines().map((line) => line.text)
	cleanCode({
		codeLines: cleanedCodeLines,
		annotationComments: parseResult.annotationComments,
		allowCleaning: ({ comment }) => commentsToClean.has(comment),
		removeAnnotationContents: ({ comment }) => removeDisplayContent.get(comment) ?? false,
		handleRemoveLine: ({ lineIndex }) => {
			codeBlock.deleteLine(lineIndex)
			return false
		},
		handleEditLine: ({ lineIndex, startColumn, endColumn, newText }) => {
			codeBlock.getLine(lineIndex)?.editText(startColumn, endColumn, newText ?? '')
			return false
		},
	})
}

function resolveAnnotationCommentHandlers(plugins: readonly ExpressiveCodePlugin[]) {
	const handlersByTag = new Map<string, RegisteredAnnotationCommentHandler>()
	plugins.forEach((plugin) => {
		plugin.annotationCommentHandlers?.forEach((handler) => {
			handler.tagNames.forEach((rawTagName) => {
				const tagName = rawTagName.trim()
				if (!tagName) return

				const existingHandler = handlersByTag.get(tagName)
				if (existingHandler && !handler.overrideExisting) {
					throw new Error(
						`Plugin "${plugin.name}" tried to register annotation comment tag "${tagName}", but it is already handled by plugin "${existingHandler.pluginName}". Set overrideExisting=true to replace it explicitly.`
					)
				}

				handlersByTag.set(tagName, {
					pluginName: plugin.name,
					handler,
				})
			})
		})
	})
	return handlersByTag
}

function applyContentCopyConvenience(options: {
	pluginName: string
	displayCleanup: AnnotationCommentContentCleanup
	copyCleanup: AnnotationCommentContentCleanup
	context: AnnotationCommentContextBase
	annotationComments: AnnotationComment[]
	logger: ExpressiveCodeLogger
}) {
	const {
		pluginName,
		displayCleanup,
		copyCleanup,
		context: { codeBlock, annotationComment },
		annotationComments,
		logger,
	} = options

	// We currently don't support removing code during rendering
	// while keeping it for copying
	if (displayCleanup === 'remove' && copyCleanup === 'keep') {
		logger.warn(
			`Annotation comments: Plugin "${pluginName}" tag "${annotationComment.tag.name}" uses content.copyCode="keep" with content.displayCode="remove". This combination is not supported yet; copied code will follow display cleanup.`
		)
		return
	}

	// Allow removing content from the copied code while still displaying it
	// (e.g. for excluding code marked to be removed from the copied code)
	if (displayCleanup === 'keep' && copyCleanup === 'remove') {
		const codeLines = codeBlock.getLines().map((line) => line.text)
		cleanCode({
			codeLines,
			annotationComments,
			allowCleaning: ({ comment }) => comment === annotationComment,
			removeAnnotationContents: true,
			updateCodeRanges: false,
			handleRemoveLine: ({ lineIndex }) => {
				codeBlock.getLine(lineIndex)?.addCopyTransform({ type: 'removeLine' })
				return true
			},
			handleEditLine: ({ lineIndex, startColumn, endColumn, newText }) => {
				codeBlock.getLine(lineIndex)?.addCopyTransform({
					type: 'editText',
					inlineRange: {
						columnStart: startColumn,
						columnEnd: endColumn,
					},
					newText: newText ?? '',
				})
				return true
			},
		})
		return
	}
}

async function resolveContentCleanup(cleanupOption: AnnotationCommentContentCleanup | AnnotationCommentContentCleanupResolver | undefined, context: AnnotationCommentContextBase) {
	if (typeof cleanupOption === 'function') return await cleanupOption(context)
	return cleanupOption ?? 'keep'
}
