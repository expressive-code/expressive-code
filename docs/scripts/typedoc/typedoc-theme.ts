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
	TupleType,
	ReferenceType,
	type SomeType,
	ArrayType,
	ConditionalType,
	IndexedAccessType,
	InferredType,
	IntersectionType,
	IntrinsicType,
	NamedTupleMember,
	QueryType,
	ReflectionType,
	TypeOperatorType,
	UnionType,
	UnknownType,
} from 'typedoc'
import { MarkdownTheme, MarkdownThemeRenderContext } from 'typedoc-plugin-markdown'
import { bold, heading, backTicks } from 'typedoc-plugin-markdown/dist/support/elements.js'
import { camelToTitleCase, escapeAngleBrackets, escapeChars, stripComments, stripLineBreaks } from 'typedoc-plugin-markdown/dist/support/utils.js'
import { flattenDeclarations, getDeclarationType } from 'typedoc-plugin-markdown/dist/theme/helpers.js'
import { member as memberPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/member.js'
import { signatureMember as signatureMemberPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/member.signature.js'
import { signatureMemberIdentifier as signatureMemberIdentifierPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/member.signature.identifier.js'
import { signatureMemberReturns as signatureMemberReturnsPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/member.signature.returns.js'
import { parametersList as parametersListPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/list.parameters.js'
import { typeParametersList as typeParametersListPartial } from 'typedoc-plugin-markdown/dist/theme/resources/partials/list.typeparameters.js'

const customBlockTagTypes = ['@deprecated', '@note'] as const
const customModifiersTagTypes = ['@alpha', '@beta', '@experimental'] as const

const externalLinkRegex = /^(http|ftp)s?:\/\//

const debug = false

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
		constructedUrl += slug(filePath.name, true)
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
				case '@alpha':
					markdown = this.#addReleaseStageAside(markdown, 'Alpha')
					break
				case '@beta':
					markdown = this.#addReleaseStageAside(markdown, 'Beta')
					break
				case '@deprecated':
					markdown = this.#addDeprecatedAside(markdown, customCommentTag.blockTag)
					break
				case '@experimental':
					markdown = this.#addReleaseStageAside(markdown, 'Experimental')
					break
				case '@note':
					markdown = this.#addAside(markdown, customCommentTag.type.slice(1), undefined, this.commentParts(customCommentTag.blockTag.content))
					break
			}
		}

		return markdown
	}

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

		return typeWrapper(`members(${ReflectionKind.singularString(container.kind)})`, md.join('\n\n'))
	}

	override member = (member: DeclarationReflection, headingLevel: number, nested?: boolean) => {
		let markdown = memberPartial(this, member, headingLevel, nested)

		// Remove "Implements" section
		markdown = markdown.replace(/##+ (Implements)\n\n([^\n]+\n)+\n/g, '')

		// Rename "Type declaration" section
		markdown = markdown.replace(/(##+) Type declaration\n/g, '$1 Object properties\n')

		// Remove trailing question marks from headings
		//markdown = markdown.replace(/(?<=^#.*)\?$/gm, '')

		return typeWrapper(`member(${ReflectionKind.singularString(member.kind)})`, markdown)
	}

	/**
	 * Handled declaration member identifiers:
	 * - Interface members
	 * - Type alias members
	 */
	override declarationMemberIdentifier = (reflection: DeclarationReflection) => {
		let markdown = this.#declarationMemberIdentifierPartial(reflection)
		//markdown = markdown.replace(/`/g, '')
		if (reflection.kind === ReflectionKind.Property || reflection.kind === ReflectionKind.TypeAlias) {
			//markdown = markdown.replace(/^> .*?: /, '')
			//markdown = `> Type: ${markdown}`
			// Add default value (if any)
			const defaultValue = this.#getDefaultValue(reflection)
			if (defaultValue) {
				markdown += `\\\n- Default: ${defaultValue}`
			}
		}
		markdown = `<PropertySignature>\n${markdown}\n</PropertySignature>`
		return typeWrapper('declarationMemberIdentifier', markdown)
	}

	override signatureMember = (signature: SignatureReflection, headingLevel: number, nested = false, accessor?: string) => {
		let markdown = signatureMemberPartial(this, signature, headingLevel, nested, accessor)
		markdown = markdown.replace(/(?<=^#+ )Parameters$/gm, 'Arguments')
		return typeWrapper('signatureMember', markdown)
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

	override typeDeclarationTable = (props: DeclarationReflection[]) => {
		const declarations = flattenDeclarations(props, true)

		const md: string[] = []

		md.push('<dl class="type-declaration-list">')

		declarations.forEach((declaration: DeclarationReflection, _index: number) => {
			md.push(`<dt>${declaration.name}</dt>`)
			md.push('<dd>')

			const propertyType = this.someType(declaration.type as SomeType).replace(/\n/g, ' ')
			md.push(`<PropertySignature>\n- Type: ${propertyType}\n</PropertySignature>`)

			const comments = declaration.comment

			if (comments) md.push(this.comment(comments))
			md.push('</dd>')
		})

		md.push('</dl>')

		return md.join('\n')
	}

	override typeDeclarationMember = (typeDeclaration: DeclarationReflection, headingLevel: number) => {
		const md: string[] = []

		if (typeDeclaration.children) {
			if (this.options.getValue('typeDeclarationFormat') === 'table') {
				md.push(this.typeDeclarationTable(typeDeclaration.children))
			} else {
				const declarations = flattenDeclarations(typeDeclaration.children)
				declarations.forEach((declaration: DeclarationReflection) => {
					md.push(this.member(declaration, headingLevel + 1, true))
				})
			}
		}
		return typeWrapper(`typeDeclarationMember`, md.join('\n\n'))
	}

	override tupleType = (tupleType: TupleType) => {
		return `\\[${tupleType.elements.map((element) => this.someType(element)).join(', ')}\\]`
	}

	override parametersList = (parameters: ParameterReflection[]) => {
		const markdown = parametersListPartial(this, parameters)
		return typeWrapper('parametersList', markdown.replace(/^• /gm, '- ').replace(/^(?!- )(?=.+)/gm, '  '))
	}

	override typeParametersList = (parameters: TypeParameterReflection[], headingLevel: number) => {
		const markdown = typeParametersListPartial(this, parameters, headingLevel)
		return typeWrapper('typeParametersList', markdown.replace(/^• /gm, '- ').replace(/^(?!- )(?=.+)/gm, '  '))
	}

	/** Remove hierarchy information (extends, extended by) */
	override memberHierarchy = (_hierarchy: DeclarationHierarchy, _headingLevel: number) => {
		return ''
	}

	/** Remove inheritance information (implementation of, inherited from, overrides) */
	override inheritance = (_reflection: DeclarationReflection | SignatureReflection, _headingLevel: number) => {
		return ''
	}

	/**
	 * Remove separate return value sections, unless they are objects
	 * which need to be documented.
	 */
	override signatureMemberReturns = (signature: SignatureReflection, headingLevel: number) => {
		let markdown = signatureMemberReturnsPartial(this, signature, headingLevel)
		// Remove return value sections that do not contain type definitions
		if (markdown.split('\n').filter((line) => line.trim().length).length <= 2) {
			markdown = ''
		}
		// Remove topmost blockquotes from the return value section
		markdown = markdown.replace(/^>( |$)/gm, '')
		return typeWrapper('signatureMemberReturns', markdown)
	}

	override someType = (someType: SomeType, foreCollpase?: boolean) => {
		return renderSomeType(this, someType, foreCollpase)
	}

	#getDefaultValue = (reflection: DeclarationReflection) => {
		const defaultTag = reflection.comment?.blockTags?.find((tag) => tag.tag === '@default')
		if (!defaultTag) return
		let markdown = this.commentParts(defaultTag.content).trim()
		if (!markdown.startsWith('`')) markdown = '```ts\n' + markdown + '\n```'
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

	/**
	 * Modifications:
	 * - No name prefix
	 */
	#declarationMemberIdentifierPartial(reflection: DeclarationReflection): string {
		const md: string[] = []

		// const useCodeBlocks = this.options.getValue('useCodeBlocks')

		const backTicks = (text: string) => text

		const declarationType = getDeclarationType(reflection)

		const prefix: string[] = []

		const modifiers = reflection.flags.filter((flag) => flag !== 'Optional' && !reflection.flags.isRest)

		if (modifiers.length) {
			prefix.push(modifiers.map((flag) => bold(backTicks(flag.toLowerCase()))).join(' '))
		}

		if (reflection.flags.isRest) {
			prefix.push('...')
		}

		// if (useCodeBlocks && isGroupKind(reflection) && KEYWORD_MAP[reflection.kind as keyof typeof KEYWORD_MAP]) {
		// 	prefix.push(KEYWORD_MAP[reflection.kind as keyof typeof KEYWORD_MAP])
		// }

		if (prefix.length) {
			md.push(prefix.join(' ') + ' ')
		}

		const name: string[] = []

		if (reflection.getSignature) {
			name.push(backTicks('get') + ' ')
		}

		if (reflection.setSignature) {
			name.push(backTicks('set') + ' ')
		}

		name.push(bold(escapeChars(reflection.name)))

		if (reflection.typeParameters) {
			name.push(`\\<${reflection.typeParameters?.map((typeParameter) => backTicks(typeParameter.name)).join(', ')}\\>`)
		}

		if (reflection.flags.isOptional) {
			name.push('?')
		}

		if (declarationType) {
			name.push(': ')
		}

		//md.push(name.join(''))

		if (declarationType) {
			md.push(this.someType(declarationType))
		}

		if (reflection.defaultValue && reflection.defaultValue !== '...') {
			md.push(` = \`${stripLineBreaks(stripComments(reflection.defaultValue))}\``)
		}

		// if (useCodeBlocks) {
		// 	md.push(';')
		// }

		const result = md.join('')
		return `- Type: ${result}`
		// return useCodeBlocks ? codeBlock(result) : `> ${result}`;
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

function renderSomeType(context: StarlightTypeDocThemeRenderContext, someType: SomeType, foreCollpase = false): string {
	if (!someType) {
		return ''
	}

	if (someType instanceof ArrayType) {
		return typeWrapper('ArrayType', context.arrayType(someType))
	}

	if (someType instanceof ConditionalType) {
		return typeWrapper('ConditionalType', context.conditionalType(someType))
	}

	if (someType instanceof IndexedAccessType) {
		return typeWrapper('IndexedAccessType', context.indexAccessType(someType))
	}

	if (someType instanceof InferredType) {
		return typeWrapper('InferredType', context.inferredType(someType))
	}

	if (someType instanceof IntersectionType && someType.types) {
		return typeWrapper('IntersectionType', context.intersectionType(someType))
	}

	if (someType instanceof IntrinsicType && someType.name) {
		return typeWrapper('IntrinsicType', context.intrinsicType(someType))
	}

	if (someType instanceof QueryType) {
		return typeWrapper('QueryType', context.queryType(someType))
	}

	if (someType instanceof ReferenceType) {
		return typeWrapper('ReferenceType', context.referenceType(someType, foreCollpase))
	}

	if (someType instanceof ReflectionType) {
		return typeWrapper('ReflectionType', context.reflectionType(someType, foreCollpase))
	}

	if (someType instanceof TypeOperatorType) {
		return typeWrapper('TypeOperatorType', context.typeOperatorType(someType))
	}

	if (someType instanceof TupleType && someType.elements) {
		return typeWrapper('TupleType', context.tupleType(someType))
	}

	if (someType instanceof UnionType && someType.types) {
		return typeWrapper('UnionType', context.unionType(someType))
	}

	if (someType instanceof UnknownType) {
		return typeWrapper('UnknownType', context.unknownType(someType))
	}

	if (someType instanceof NamedTupleMember) {
		return typeWrapper('NamedTupleMember', context.namedTupleType(someType))
	}

	if (someType.toString() == 'null') {
		return 'null'
	}

	return typeWrapper('toString', backTicks(someType?.toString()))
}

type CustomBlockTagType = (typeof customBlockTagTypes)[number]
type CustomModifierTagType = (typeof customModifiersTagTypes)[number]

type CustomTag =
	| { type: CustomModifierTagType }
	| {
			blockTag: CommentTag
			type: CustomBlockTagType
	  }

function typeWrapper(type: string, content: string) {
	return debug ? `\\<${type}\\>\n${content}\n\\</${type}\\>` : content
}

function getAsideMarkdown(type: string, title: string | undefined, content: string) {
	return `:::${type}${title ? `[${title}]` : ''}
${content}
:::`
}
