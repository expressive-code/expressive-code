import type { AnnotationComment } from 'annotation-comments'
import type { ExpressiveCodeHookContextBase } from '../../../common/plugin-hooks'
import type { AnnotationCommentHandler } from '../../../common/annotation-comments'
import type { TransformTarget } from '../../../common/transforms'

export type RegisteredAnnotationCommentHandler = {
	pluginName: string
	handler: AnnotationCommentHandler
}

export type AnnotationCommentContextBase = ExpressiveCodeHookContextBase & {
	annotationComment: AnnotationComment
	targets: TransformTarget[]
	content: {
		lines: string[]
		text: string
	}
}
