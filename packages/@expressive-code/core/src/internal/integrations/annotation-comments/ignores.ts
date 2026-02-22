import type { AnnotationTag } from 'annotation-comments'
import type { AnnotationCommentIgnoreDefinition, ExpressiveCodeBlock, ExpressiveCodeBlockProps } from '../../../common/block'
import type { MetaOption } from '../../../helpers/meta-options'
import rangeParser from 'parse-numeric-range'

export class AnnotationCommentIgnores {
	constructor(codeBlock: ExpressiveCodeBlock) {
		// Transfer any relevant meta options to props first
		// to ensure we have a single source of truth for ignores
		this.transferMetaOptionsToProps(codeBlock)
		// Now create ignore matchers based on the consolidated props
		this.#ignoreMatchers = toIgnoreDefinitionsArray(codeBlock.props.ignoreTags).flatMap((definition) => this.createIgnoreMatcher(definition))
	}

	readonly #ignoreMatchers: Array<(tag: AnnotationTag) => boolean>

	shouldIgnoreTag(tag: AnnotationTag): boolean {
		return this.#ignoreMatchers.some((matcher) => matcher(tag))
	}

	private transferMetaOptionsToProps(codeBlock: ExpressiveCodeBlock) {
		const transferredDefinitions = codeBlock.metaOptions.list(['ignore-tags', 'ignoreTags']).flatMap((option) => this.parseMetaOption(option))
		if (!transferredDefinitions.length) return

		// Preserve existing props and append meta-defined ignores in source order.
		codeBlock.props.ignoreTags = [...toIgnoreDefinitionsArray(codeBlock.props.ignoreTags), ...transferredDefinitions]
	}

	private parseMetaOption(option: MetaOption): AnnotationCommentIgnoreDefinition[] {
		const { kind, value } = option
		if (kind === 'boolean') return value ? [value] : []
		if (kind === 'string') return [value]
		if (kind === 'range') return [{ range: value }]
		return []
	}

	private createIgnoreMatcher(definition: AnnotationCommentIgnoreDefinition): Array<(tag: AnnotationTag) => boolean> {
		if (typeof definition === 'boolean') {
			if (!definition) return []
			return [() => true]
		}

		if (typeof definition === 'string') {
			const parsedIgnore = parseStringIgnoreValue(definition)
			if (!parsedIgnore) return []
			let remainingMatches = parsedIgnore.maxMatches
			return [
				(tag) => {
					if (!parsedIgnore.tagNames.has('*') && !parsedIgnore.tagNames.has(tag.name)) return false
					if (remainingMatches === undefined) return true
					if (remainingMatches < 1) return false
					remainingMatches -= 1
					return true
				},
			]
		}

		if (!isIgnoreRangeDefinition(definition)) return []
		const lineIndices = parseLineIndices(definition.range)
		if (!lineIndices.size) return []
		return [
			(tag) => {
				const tagStartLine = tag.range.start.line
				const tagEndLine = tag.range.end.line
				for (let lineIndex = tagStartLine; lineIndex <= tagEndLine; lineIndex++) {
					if (lineIndices.has(lineIndex)) return true
				}
				return false
			},
		]
	}
}

function toIgnoreDefinitionsArray(input: ExpressiveCodeBlockProps['ignoreTags'] | undefined) {
	if (!input) return []
	return Array.isArray(input) ? input : [input]
}

function isIgnoreRangeDefinition(input: unknown): input is Extract<AnnotationCommentIgnoreDefinition, { range: string }> {
	return typeof input === 'object' && input !== null && 'range' in input && typeof input.range === 'string'
}

function parseStringIgnoreValue(value: string): { tagNames: Set<string>; maxMatches: number | undefined } | undefined {
	let tagsPart = value.trim()
	if (!tagsPart) return

	let maxMatches: number | undefined
	const countMatch = tagsPart.match(/^(.*?):\s*(-?\d+)\s*$/)
	if (countMatch) {
		tagsPart = countMatch[1]?.trim() ?? ''
		maxMatches = Math.max(Number.parseInt(countMatch[2], 10), 0)
	}

	const tagNames = tagsPart
		.split(',')
		.map((tagName) => tagName.trim())
		.filter(Boolean)
	if (!tagNames.length) return

	return {
		tagNames: new Set(tagNames),
		maxMatches,
	}
}

function parseLineIndices(value: string): Set<number> {
	const parsedLineIndices = rangeParser(value)
	return new Set(parsedLineIndices.filter((lineIndex) => Number.isInteger(lineIndex) && lineIndex >= 0))
}
