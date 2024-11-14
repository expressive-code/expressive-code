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

import { parseAnnotationComments } from 'annotation-comments'
import type { ExpressiveCodeBlock } from '../common/block'
import type { ResolvedExpressiveCodeEngineConfig } from '../common/engine'
import type { ExpressiveCodePlugin } from '../common/plugin'
import { AnnotationCommentHandler } from '../common/annotation-comments'

export type RunCommentHandlersContext = {
	codeBlock: ExpressiveCodeBlock
	plugins: readonly ExpressiveCodePlugin[]
	config: ResolvedExpressiveCodeEngineConfig
}

export async function handleAnnotationComments(context: RunCommentHandlersContext) {
	const { codeBlock, plugins, config } = context
	const uniqueErrors = new Set<string>()

	// Parse annotation comments in the code
	const codeLines = codeBlock.code.split('\n')
	const { annotationComments, errorMessages } = parseAnnotationComments({ codeLines })
	errorMessages.forEach((msg) => uniqueErrors.add(`Parsing error: ${msg}`))

	// Run annotation comment handlers
	for (const annotationComment of annotationComments) {
		const handler = getHandlerByTagName(annotationComment.tag.name, plugins, uniqueErrors)
		if (!handler) continue
		//const { contents, inlineTargets, fullLineTargets, codeBlock, custom } = handler
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