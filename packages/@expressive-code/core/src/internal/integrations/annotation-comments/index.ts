import type { AnnotationComment } from 'annotation-comments'
import type { AnnotationCommentContentCleanup, AnnotationCommentContentContext, AnnotationCommentHandler } from '../../../common/annotation-comments'
import type { ExpressiveCodeHookContextBase } from '../../../common/plugin-hooks'
import type { ExpressiveCodeLogger } from '../../../common/logger'
import type { ExpressiveCodePlugin } from '../../../common/plugin'
import type { RenderTransform } from '../../../common/render-transforms'
import { cleanCode, parseAnnotationComments } from 'annotation-comments'
import { applyContentRenderConvenience } from './content-rendering'
import { getAnnotationCommentTargets, getDefaultInsertOnDeleteLine, getDefaultInsertPosition } from './target-resolving'

type RegisteredAnnotationCommentHandler = {
	pluginName: string
	handler: AnnotationCommentHandler
}

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
	const uniqueIssues = new Set<string>()
	const reportIssue = (message: string) => uniqueIssues.add(message)
	const handlersByTag = collectAnnotationCommentHandlers({
		plugins: config.plugins,
		reportIssue,
	})

	const parseResult = parseAnnotationComments({
		codeLines: codeBlock.getLines().map((line) => line.text),
	})

	parseResult.errorMessages.forEach((errorMessage) => {
		reportIssue(`Parsing error: ${errorMessage}`)
	})

	const commentsToClean = new Set<AnnotationComment>()
	const removeDisplayContent = new Map<AnnotationComment, boolean>()

	for (const annotationComment of parseResult.annotationComments) {
		try {
			const resolvedComment = await processAnnotationComment({
				baseContext: options,
				annotationComment,
				annotationComments: parseResult.annotationComments,
				handlersByTag,
			})
			if (!resolvedComment) continue
			commentsToClean.add(annotationComment)
			removeDisplayContent.set(annotationComment, resolvedComment.removeDisplayContent)
		} catch (error) {
			const registeredHandler = handlersByTag.get(annotationComment.tag.name)
			const byPlugin = registeredHandler ? ` handled by plugin "${registeredHandler.pluginName}"` : ''
			reportIssue(`Failed to process annotation comment tag "${annotationComment.tag.name}"${byPlugin}: ${toErrorMessage(error)}`)
		}
	}

	if (commentsToClean.size) {
		const cleanedCodeLines = codeBlock.getLines().map((line) => line.text)
		try {
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
		} catch (error) {
			reportIssue(`Failed to clean annotation comments from display code: ${toErrorMessage(error)}`)
		}
	}

	logAnnotationCommentIssues({
		logger: config.logger,
		codeBlock,
		uniqueIssues,
	})
}

/**
 * Processes a single annotation comment and resolves to content cleanup instructions.
 */
async function processAnnotationComment(options: {
	baseContext: ExpressiveCodeHookContextBase
	annotationComment: AnnotationComment
	annotationComments: AnnotationComment[]
	handlersByTag: Map<string, RegisteredAnnotationCommentHandler>
}): Promise<{ removeDisplayContent: boolean } | undefined> {
	const { baseContext, annotationComment, annotationComments, handlersByTag } = options

	// Always clean parser-level control comments from display code
	if (annotationComment.tag.name === 'ignore-tags') {
		return { removeDisplayContent: true }
	}

	const registeredHandler = handlersByTag.get(annotationComment.tag.name)
	if (!registeredHandler) return

	const { codeBlock } = baseContext
	const annotationLine = codeBlock.getLine(annotationComment.commentRange.start.line)
	if (!annotationLine) {
		throw new Error(`Cannot resolve annotation line ${annotationComment.commentRange.start.line}`)
	}

	const targets = getAnnotationCommentTargets(annotationComment, codeBlock)
	const contentLines = [...annotationComment.contents]
	const content = {
		lines: contentLines,
		text: contentLines.join('\n'),
	}
	const context: AnnotationCommentContentContext = {
		...baseContext,
		annotationComment,
		targets,
		content,
	}

	let displayCleanup: AnnotationCommentContentCleanup = 'keep'
	const displayCleanupOption = registeredHandler.handler.content?.displayCode
	if (typeof displayCleanupOption === 'function') {
		// Run `content.displayCode` hook (if any)
		displayCleanup = (await displayCleanupOption(context)) ?? 'keep'
	} else if (displayCleanupOption) {
		displayCleanup = displayCleanupOption
	}

	let copyCleanup: AnnotationCommentContentCleanup = 'keep'
	const copyCleanupOption = registeredHandler.handler.content?.copyCode
	if (typeof copyCleanupOption === 'function') {
		// Run `content.copyCode` hook (if any)
		copyCleanup = (await copyCleanupOption(context)) ?? 'keep'
	} else if (copyCleanupOption) {
		copyCleanup = copyCleanupOption
	}

	await applyContentRenderConvenience({
		handler: registeredHandler.handler,
		context,
	})

	applyContentCopyConvenience({
		...registeredHandler,
		context,
		displayCleanup,
		copyCleanup,
		annotationComments,
	})

	const defaultInsertPosition = getDefaultInsertPosition(annotationComment)
	const defaultInsertOnDeleteLine = getDefaultInsertOnDeleteLine(annotationComment)
	const addRenderTransform = (renderTransform: RenderTransform) => {
		annotationLine.addRenderTransform({
			...renderTransform,
			position: renderTransform.position ?? defaultInsertPosition,
			onDeleteLine: renderTransform.onDeleteLine ?? defaultInsertOnDeleteLine,
		})
	}

	// Run annotation comment handler hook provided by the plugin
	await registeredHandler.handler.handle({
		...context,
		annotationLine,
		addRenderTransform,
	})

	return {
		removeDisplayContent: displayCleanup === 'remove',
	}
}

/**
 * Collects annotation comment handlers from all plugins and resolves tag conflicts.
 */
function collectAnnotationCommentHandlers(options: { plugins: readonly ExpressiveCodePlugin[]; reportIssue: (message: string) => void }) {
	const { plugins, reportIssue } = options
	const handlersByTag = new Map<string, RegisteredAnnotationCommentHandler>()
	plugins.forEach((plugin) => {
		plugin.annotationCommentHandlers?.forEach((handler) => {
			handler.tagNames.forEach((rawTagName) => {
				const tagName = rawTagName.trim()
				if (!tagName) return

				const existingHandler = handlersByTag.get(tagName)
				if (existingHandler && !handler.overrideExisting) {
					reportIssue(
						`Plugin "${plugin.name}" tried to register annotation comment tag "${tagName}", but it is already handled by plugin "${existingHandler.pluginName}". Set overrideExisting=true to replace it explicitly.`
					)
					return
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

/**
 * Applies copy-only content cleanup behavior by translating cleaned ranges into copy transforms.
 */
function applyContentCopyConvenience(options: {
	pluginName: string
	displayCleanup: AnnotationCommentContentCleanup
	copyCleanup: AnnotationCommentContentCleanup
	context: AnnotationCommentContentContext
	annotationComments: AnnotationComment[]
}) {
	const {
		pluginName,
		displayCleanup,
		copyCleanup,
		context: { codeBlock, annotationComment },
		annotationComments,
	} = options

	// We currently don't support removing code during rendering
	// while keeping it for copying, so this is treated as an invalid handler configuration
	if (displayCleanup === 'remove' && copyCleanup === 'keep') {
		throw new Error(`Plugin "${pluginName}" tag "${annotationComment.tag.name}" uses content.copyCode="keep" with content.displayCode="remove". This combination is not supported.`)
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

/**
 * Normalizes unknown thrown values into a readable error message string.
 */
function toErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error)
}

/**
 * Logs all collected annotation comment issues once per code block with location context.
 */
function logAnnotationCommentIssues(options: { logger: ExpressiveCodeLogger; codeBlock: ExpressiveCodeHookContextBase['codeBlock']; uniqueIssues: Set<string> }) {
	const { logger, codeBlock, uniqueIssues } = options
	if (!uniqueIssues.size) return
	const location = getIssueLogLocation(codeBlock)
	const entries = [...uniqueIssues].map((message) => `- ${message}`).join('\n')
	logger.warn(`Annotation comments: Encountered issues in ${location}:\n${entries}`)
}

/**
 * Builds a human-readable location label for warning logs.
 */
function getIssueLogLocation(codeBlock: ExpressiveCodeHookContextBase['codeBlock']) {
	const { parentDocument } = codeBlock
	const locationParts = [parentDocument?.sourceFilePath ? `document "${parentDocument.sourceFilePath}"` : 'the current document']
	if (parentDocument?.positionInDocument) {
		const index = parentDocument.positionInDocument.groupIndex + 1
		const { totalGroups } = parentDocument.positionInDocument
		locationParts.push(totalGroups ? `code block ${index}/${totalGroups}` : `code block ${index}`)
	}
	return locationParts.join(', ')
}
