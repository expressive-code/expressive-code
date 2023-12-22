import path from 'node:path'

import { slug } from 'github-slugger'
import {
	Reflection,
	type Comment,
	type CommentTag,
	type Options,
	type PageEvent,
	ParameterReflection,
	TypeParameterReflection,
	DeclarationReflection,
	ReflectionKind,
	SignatureReflection,
} from 'typedoc'
import { MarkdownTheme, MarkdownThemeRenderContext } from 'typedoc-plugin-markdown'
import { comment as commentPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/comment.js'
import { member as memberPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/member.js'
import { declarationMemberIdentifier as declarationMemberIdentifierPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/member.declaration.identifier.js'
import { signatureMemberIdentifier as signatureMemberIdentifierPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/member.signature.identifier.js'
import { parametersList as parametersListPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/list.parameters.js'
import { typeParametersList as typeParametersListPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/list.typeparameters.js'

const customBlockTagTypes = ['@deprecated'] as const
const customModifiersTagTypes = ['@alpha', '@beta', '@experimental'] as const

const externalLinkRegex = /^(http|ftp)s?:\/\//

export class StarlightTypeDocTheme extends MarkdownTheme {
	override getRenderContext(event: PageEvent<Reflection>) {
		return new StarlightTypeDocThemeRenderContext(event, this.application.options)
	}
}

class StarlightTypeDocThemeRenderContext extends MarkdownThemeRenderContext {
	constructor(event: PageEvent<Reflection>, options: Options) {
		super(event, options)
	}

	override relativeURL = (url: string | undefined) => {
		if (!url) {
			return null
		} else if (externalLinkRegex.test(url)) {
			return url
		}

		const filePath = path.parse(url)
		const [, anchor] = filePath.base.split('#')
		const segments = filePath.dir
			.split('/')
			.map((segment) => slug(segment))
			.filter((segment) => segment !== '')
		const baseUrl = this.options.getValue('starlight-typedoc-output')

		let constructedUrl = typeof baseUrl === 'string' ? baseUrl : ''
		constructedUrl += segments.length > 0 ? `${segments.join('/')}/` : ''
		constructedUrl += slug(filePath.name)
		constructedUrl += '/'
		constructedUrl += anchor && anchor.length > 0 ? `#${anchor}` : ''

		return constructedUrl
	}

	override comment = (comment: Comment, headingLevel?: number, showSummary?: boolean, showTags?: boolean) => {
		const filteredComment = { ...comment } as Comment
		filteredComment.blockTags = []
		filteredComment.modifierTags = new Set<`@${string}`>()

		const customTags: CustomTag[] = []

		for (const blockTag of comment.blockTags) {
			if (this.#isCustomBlockCommentTagType(blockTag.tag)) {
				customTags.push({ blockTag, type: blockTag.tag })
			} else {
				filteredComment.blockTags.push(blockTag)
			}
		}

		for (const modifierTag of comment.modifierTags) {
			if (this.#isCustomModifierCommentTagType(modifierTag)) {
				customTags.push({ type: modifierTag })
			} else {
				filteredComment.modifierTags.add(modifierTag)
			}
		}

		filteredComment.summary = comment.summary.map((part) => {
			if (part.kind === 'inline-tag' && (part.tag === '@link' || part.tag === '@linkcode' || part.tag === '@linkplain') && part.target instanceof Reflection) {
				const partURL = this.relativeURL(part.target.url)

				if (partURL) {
					return { ...part, target: partURL }
				}
			}

			return part
		})

		let markdown = commentPartial(this, filteredComment, headingLevel, showSummary, showTags)

		if (showTags === true && showSummary === false) {
			return markdown
		}

		for (const customCommentTag of customTags) {
			switch (customCommentTag.type) {
				case '@alpha': {
					markdown = this.#addReleaseStageAside(markdown, 'Alpha')
					break
				}
				case '@beta': {
					markdown = this.#addReleaseStageAside(markdown, 'Beta')
					break
				}
				case '@deprecated': {
					markdown = this.#addDeprecatedAside(markdown, customCommentTag.blockTag)
					break
				}
				case '@experimental': {
					markdown = this.#addReleaseStageAside(markdown, 'Experimental')
					break
				}
			}
		}

		return markdown
	}

	override member = (member: DeclarationReflection, headingLevel: number, nested?: boolean) => {
		const markdown = memberPartial(this, member, headingLevel, nested)
		// Remove trailing question marks from headings
		return markdown.replace(/(?<=^#.*)\?$/gm, '')
	}

	/**
	 * Handled declaration member identifiers:
	 * - Interface members
	 * - Type alias members
	 */
	override declarationMemberIdentifier = (reflection: DeclarationReflection) => {
		let markdown = declarationMemberIdentifierPartial(this, reflection)
		markdown = markdown.replace(/`/g, '')
		if (reflection.kind === ReflectionKind.Property) {
			markdown = markdown.replace(/^> .*?: /, '')
			markdown = `Type: <code class="property-type">${markdown}</code>`
		}
		return markdown
	}

	override signatureMemberIdentifier = (signature: SignatureReflection, opts?: { accessor?: string | undefined; includeType?: boolean | undefined }) => {
		let markdown = signatureMemberIdentifierPartial(this, signature, opts as Parameters<typeof signatureMemberIdentifierPartial>[2])
		markdown = markdown.replace(/`/g, '')
		// if (signature.kind === ReflectionKind.CallSignature || signature.kind === ReflectionKind.ConstructorSignature) {
		markdown = markdown.replace(/^> /, '')
		markdown = `- <code class="function-signature">${markdown}</code>`
		// }
		return markdown
	}

	override parametersList = (parameters: ParameterReflection[]) => {
		const markdown = parametersListPartial(this, parameters)
		return markdown.replace(/^• /gm, '- ').replace(/^(?!- )(?=.+)/gm, '  ')
	}

	override typeParametersList = (parameters: TypeParameterReflection[], headingLevel: number) => {
		const markdown = typeParametersListPartial(this, parameters, headingLevel)
		return markdown.replace(/^• /gm, '- ').replace(/^(?!- )(?=.+)/gm, '  ')
	}

	#isCustomBlockCommentTagType = (tag: string): tag is CustomBlockTagType => {
		return customBlockTagTypes.includes(tag as CustomBlockTagType)
	}

	#isCustomModifierCommentTagType = (tag: string): tag is CustomModifierTagType => {
		return customModifiersTagTypes.includes(tag as CustomModifierTagType)
	}

	#addAside(markdown: string, ...args: Parameters<typeof getAsideMarkdown>) {
		return `${markdown}\n\n${getAsideMarkdown(...args)}`
	}

	#addDeprecatedAside(markdown: string, blockTag: CommentTag) {
		const content = blockTag.content.length > 0 ? this.commentParts(blockTag.content) : 'This API is no longer supported and may be removed in a future release.'

		return this.#addAside(markdown, 'caution', 'Deprecated', content)
	}

	#addReleaseStageAside(markdown: string, title: string) {
		return this.#addAside(markdown, 'caution', title, 'This API should not be used in production and may be trimmed from a public release.')
	}
}

type CustomBlockTagType = (typeof customBlockTagTypes)[number]
type CustomModifierTagType = (typeof customModifiersTagTypes)[number]

type CustomTag =
	| { type: CustomModifierTagType }
	| {
			blockTag: CommentTag
			type: CustomBlockTagType
	  }

type AsideType = 'caution' | 'danger' | 'note' | 'tip'

function getAsideMarkdown(type: AsideType, title: string, content: string) {
	return `:::${type}[${title}]
${content}
:::`
}
