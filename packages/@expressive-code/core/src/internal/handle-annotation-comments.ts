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
	// Parse annotation comments in the code
	const codeLines = codeBlock.code.split('\n')
	const { annotationComments, errorMessages } = parseAnnotationComments({ codeLines })
	// Inform the user about any parsing errors
	if (errorMessages.length > 0) {
		config.logger.warn(`Failed to parse annotation comments in code block "${codeBlock.code}":\n${errorMessages.map((msg) => `- ${msg}`).join('\n')}`)
	}
	// Prepare annotation comment handlers
	const handlerByTagName = new Map<string, AnnotationCommentHandler>()
	for (const plugin of plugins) {
		for (const handler of plugin.annotationCommentHandlers ?? []) {
			for (const tagName of handler.tagNames) {
				if (!handler.overrideExisting && handlerByTagName.has(tagName)) {
					config.logger.warn(
						`Plugin "${plugin.name}" tried to register an annotation comment handler for tag name "${tagName}" that is already registered by another plugin. Use the \`overrideExisting\` option to replace the existing handler.`
					)
					continue
				}
				handlerByTagName.set(tagName, handler)
			}
		}
	}
	// Run annotation comment handlers
	for (const annotationComment of annotationComments) {
		const handler = handlerByTagName.get(annotationComment.tag.name)
		if (!handler) {
			config.logger.warn(`No annotation comment handler found for tag name "${annotationComment.tag.name}"`)
			continue
		}
		
	}
	await Promise.resolve()
}
