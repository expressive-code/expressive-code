import type { LanguageRegistration as ShikiLanguageRegistration, MaybeGetter, MaybeArray, StringLiteralUnion } from 'shiki'

// Extract or rebuild non-exported types from Shiki
type IShikiRawRepository = ShikiLanguageRegistration['repository']
type IShikiRawRule = IShikiRawRepository[keyof IShikiRawRepository]
type ILocation = IShikiRawRepository['$vscodeTextmateLocation']
interface ILocatable {
	readonly $vscodeTextmateLocation?: ILocation | undefined
}

// Define modified versions of internal Shiki types that use our less strict `IRawRule`
interface IRawRepositoryMap {
	[name: string]: IRawRule
}
type IRawRepository = IRawRepositoryMap & ILocatable
interface IRawCapturesMap {
	[captureId: string]: IRawRule
}
type IRawCaptures = IRawCapturesMap & ILocatable

// Create our less strict version of Shiki's internal `IRawRule` interface
interface IRawRule extends Omit<IShikiRawRule, 'applyEndPatternLast' | 'captures' | 'patterns'> {
	readonly applyEndPatternLast?: boolean | number | undefined
	readonly captures?: IRawCaptures | undefined
	readonly comment?: string | undefined
	readonly patterns?: IRawRule[] | undefined
}

/**
 * A less strict version of Shiki's `LanguageRegistration` interface that aligns better with
 * actual grammars found in the wild. This version attempts to reduce the amount
 * of type errors that would occur when importing and adding external grammars,
 * while still being supported by the language processing code.
 */
export interface LanguageRegistration extends Omit<ShikiLanguageRegistration, 'repository'> {
	repository?: IRawRepository | undefined
}

export type LanguageInput = MaybeGetter<MaybeArray<LanguageRegistration>>

export type LanguageAlias<L extends string> = Record<string, StringLiteralUnion<L>>

export { ShikiLanguageRegistration }

/**
 * Creates a set of language registrations that inject the given language into
 * Markdown and MDX fenced code blocks.
 */
export function getNestedCodeBlockInjectionLangs(lang: LanguageRegistration, langAlias: Record<string, string> = {}) {
	const injectionLangs: LanguageRegistration[] = []
	const langNameKey = lang.name.replace(/[^a-zA-Z0-9]/g, '_')
	const langNameAndAliases = [lang.name, ...(lang.aliases ?? [])]
	// Add user-configured aliases for the current lang (if any)
	Object.entries(langAlias).forEach(([alias, target]) => {
		if (target === lang.name && !langNameAndAliases.includes(alias)) langNameAndAliases.push(alias)
	})

	// Create injection language registration for Markdown
	injectionLangs.push({
		name: `${lang.name}-fenced-md`,
		scopeName: `source.${lang.name}.fenced_code_block`,
		injectTo: ['text.html.markdown'],
		injectionSelector: 'L:text.html.markdown',
		patterns: [
			{
				include: `#fenced_code_block_${langNameKey}`,
			},
		],
		repository: {
			[`fenced_code_block_${langNameKey}`]: {
				begin: `(^|\\G)(\\s*)(\`{3,}|~{3,})\\s*(?i:(${langNameAndAliases.join('|')})((\\s+|:|,|\\{|\\?)[^\`]*)?$)`,
				beginCaptures: {
					3: {
						name: 'punctuation.definition.markdown',
					},
					4: {
						name: 'fenced_code.block.language.markdown',
					},
					5: {
						name: 'fenced_code.block.language.attributes.markdown',
					},
				},
				end: '(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$',
				endCaptures: {
					3: {
						name: 'punctuation.definition.markdown',
					},
				},
				name: 'markup.fenced_code.block.markdown',
				patterns: [
					{
						begin: '(^|\\G)(\\s*)(.*)',
						while: '(^|\\G)(?!\\s*([`~]{3,})\\s*$)',
						contentName: `meta.embedded.block.${lang.name}`,
						patterns: [
							{
								include: lang.scopeName,
							},
						],
					},
				],
			},
		},
	})

	// Create injection language registration for MDX
	injectionLangs.push({
		name: `${lang.name}-fenced-mdx`,
		scopeName: `source.${lang.name}.fenced_code_block`,
		injectTo: ['source.mdx'],
		injectionSelector: 'L:source.mdx',
		patterns: [
			{
				include: `#fenced_code_block_${langNameKey}`,
			},
		],
		repository: {
			[`fenced_code_block_${langNameKey}`]: {
				begin: `(?:^|\\G)[\\t ]*(\`{3,})(?:[\\t ]*((?i:(?:.*\\.)?${langNameAndAliases.join('|')}))(?:[\\t ]+((?:[^\\n\\r\`])+))?)(?:[\\t ]*$)`,
				beginCaptures: {
					1: {
						name: 'string.other.begin.code.fenced.mdx',
					},
					2: {
						name: 'entity.name.function.mdx',
						patterns: [
							{
								include: '#markdown-string',
							},
						],
					},
					3: {
						patterns: [
							{
								include: '#markdown-string',
							},
						],
					},
				},
				end: '(?:^|\\G)[\\t ]*(\\1)(?:[\\t ]*$)',
				endCaptures: {
					1: {
						name: 'string.other.end.code.fenced.mdx',
					},
				},
				name: `markup.code.${lang.name}.mdx`,
				patterns: [
					{
						begin: '(^|\\G)(\\s*)(.*)',
						contentName: `meta.embedded.${lang.name}`,
						patterns: [
							{
								include: lang.scopeName,
							},
						],
						while: '(^|\\G)(?![\\t ]*([`~]{3,})[\\t ]*$)',
					},
				],
			},
		},
	})

	return injectionLangs
}
