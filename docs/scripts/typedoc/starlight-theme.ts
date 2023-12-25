import path from 'node:path'

import { slug } from 'github-slugger'
import {
	Reflection,
	type Comment,
	type CommentTag,
	type Options,
	type PageEvent,
	type DeclarationHierarchy,
	ParameterReflection,
	TypeParameterReflection,
	DeclarationReflection,
	ReflectionKind,
	SignatureReflection,
	ContainerReflection,
	ReflectionCategory,
} from 'typedoc'
import { MarkdownTheme, MarkdownThemeRenderContext } from 'typedoc-plugin-markdown'
import { bold, heading } from 'typedoc-plugin-markdown/dist/support/elements.js'
import { camelToTitleCase, escapeAngleBrackets, escapeChars } from 'typedoc-plugin-markdown/dist/support/utils.js'
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

		let markdown = this.#commentPartial(filteredComment, headingLevel, showSummary, showTags)

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
		let markdown = memberPartial(this, member, headingLevel, nested)

		// Remove "Implements" section
		markdown = markdown.replace(/##+ (Implements)\n\n([^\n]+\n)+\n/g, '')

		// Remove trailing question marks from headings
		markdown = markdown.replace(/(?<=^#.*)\?$/gm, '')

		return markdown
	}

	/**
	 * We only remove the `***` lines here
	 */
	override members = (container: ContainerReflection, headingLevel: number) => {
		const md: string[] = []

		const pushCategories = (categories: ReflectionCategory[], headingLevel: number) => {
			categories
				?.filter((category) => !category.allChildrenHaveOwnDocument())
				.forEach((item) => {
					md.push(heading(headingLevel, item.title))
					pushChildren(item.children, headingLevel + 1)
				})
		}

		const pushChildren = (children?: DeclarationReflection[], memberHeadingLevel?: number) => {
			const items = children?.filter((item) => !item.hasOwnDocument)
			items?.forEach((item) => {
				md.push(this.member(item, memberHeadingLevel || headingLevel))
			})
		}

		if (container.categories?.length) {
			pushCategories(container.categories, headingLevel)
		} else {
			if (this.options.getValue('excludeGroups') && container.kindOf([ReflectionKind.Project, ReflectionKind.Module, ReflectionKind.Namespace])) {
				if (container.categories?.length) {
					pushCategories(container.categories, headingLevel)
				} else {
					pushChildren(container.children, headingLevel)
				}
			} else {
				const groupsWithChildren = container.groups?.filter((group) => !group.allChildrenHaveOwnDocument())
				groupsWithChildren?.forEach((group) => {
					if (group.categories) {
						md.push(heading(headingLevel, group.title))
						pushCategories(group.categories, headingLevel + 1)
					} else {
						const isPropertiesGroup = group.children.every((child) => child.kindOf(ReflectionKind.Property))

						const isEnumGroup = group.children.every((child) => child.kindOf(ReflectionKind.EnumMember))

						md.push(heading(headingLevel, group.title))

						if (isPropertiesGroup && this.options.getValue('propertiesFormat') === 'table') {
							md.push(this.propertiesTable(group.children))
						} else if (isEnumGroup && this.options.getValue('enumMembersFormat') === 'table') {
							md.push(this.enumMembersTable(group.children))
						} else {
							pushChildren(group.children, headingLevel + 1)
						}
					}
				})
			}
		}

		return md.join('\n\n')
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
			markdown = `> Type: <code class="property-type">${markdown}</code>`
			// Add default value (if any)
			const defaultValue = this.#getDefaultValue(reflection)
			if (defaultValue) {
				markdown += `\\\n> Default: <span class="property-default">${defaultValue}</span>`
			}
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

	/** Remove hierarchy information (extends, extended by) */
	override memberHierarchy = (_hierarchy: DeclarationHierarchy, _headingLevel: number) => {
		return ''
	}

	/** Remove inheritance information (implementation of, inherited from, overrides) */
	override inheritance = (_reflection: DeclarationReflection | SignatureReflection, _headingLevel: number) => {
		return ''
	}

	#getDefaultValue = (reflection: DeclarationReflection) => {
		const defaultTag = reflection.comment?.blockTags?.find((tag) => tag.tag === '@default')
		if (!defaultTag) return
		let markdown = this.commentParts(defaultTag.content).trim().replace(/\r\n/g, '\n')
		const codeBlockRegExp = /^```[a-zA-Z0-9-]*(?:\s+[^\n]*)?\n([\s\S]*?)\n```$/g
		markdown = markdown.replace(codeBlockRegExp, (_, code: string) => {
			return '``' + code + (code.endsWith('`') ? ' ' : '') + '``'
		})
		return markdown
	}

	/**
	 * We don't output `@default` tags in our version
	 */
	#commentPartial(comment: Comment, headingLevel?: number, showSummary = true, showTags = true): string {
		const md: string[] = []

		if (showSummary && comment.summary?.length > 0) {
			md.push(this.commentParts(comment.summary))
		}

		if (showTags && comment.blockTags?.length) {
			const tags = comment.blockTags
				.filter((tag) => tag.tag !== '@returns' && tag.tag !== '@default')
				.map((tag) => {
					const tagName = tag.tag.substring(1)
					const tagText = camelToTitleCase(tagName)
					const tagMd = [headingLevel ? heading(headingLevel, tagText) + '\n' : bold(tagText)]
					tagMd.push(this.commentParts(tag.content))
					return tagMd.join('\n')
				})
			md.push(tags.join('\n\n'))
		}

		return escapeAngleBrackets(md.join('\n\n'))
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
