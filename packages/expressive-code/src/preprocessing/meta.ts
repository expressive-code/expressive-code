import { MarkerTypeOrder } from '../common'

/**
 * Preprocesses the given meta information string and returns contained supported properties.
 *
 * Meta information is the string after the opening code fence and language name.
 */
export function preprocessMeta(meta: string) {
	// Try to find the meta property `title="..."` or `title='...'`,
	// store its value and remove it from meta
	let title: string | undefined
	meta = meta.replace(/(?:\s|^)title\s*=\s*(["'])(.*?)(?<!\\)\1/, (_, __, content) => {
		title = content
		return ''
	})

	// Find line marking definitions inside curly braces, with an optional marker type prefix.
	//
	// Examples:
	// - `{4-5,10}` (if no marker type prefix is given, it defaults to `mark`)
	// - `mark={4-5,10}`
	// - `del={4-5,10}`
	// - `ins={4-5,10}`
	const lineMarkings: string[] = []
	meta = meta.replace(/(?:\s|^)(?:([a-zA-Z]+)\s*=\s*)?({[0-9,\s-]*})/g, (match, prefix, range) => {
		if (prefix && !MarkerTypeOrder.includes(prefix)) return match
		lineMarkings.push(`${prefix || 'mark'}=${range}`)
		return ''
	})

	// Find inline marking definitions inside single or double quotes (to match plaintext strings)
	// or forward slashes (to match regular expressions), with an optional marker type prefix.
	//
	// Examples for plaintext strings:
	// - `"Astro.props"`               (if no marker type prefix is given, it defaults to `mark`)
	// - `ins="<Button />"`            (matches will be marked with "inserted" style)
	// - `del="<p class=\"hi\">"`      (special chars in the search string can be escaped by `\`)
	// - `del='<p class="hi">'`        (use single quotes to make it easier to match double quotes)
	//
	// Examples for regular expressions:
	// - `/sidebar/`                   (if no marker type prefix is given, it defaults to `mark`)
	// - `mark=/astro-[a-z]+/`         (all common regular expression features are supported)
	// - `mark=/slot="(.*?)"/`         (if capture groups are contained, these will be marked)
	// - `del=/src\/pages\/.*\.astro/` (escaping special chars with a backslash works, too)
	// - `ins=/this|that/`
	const inlineMarkings: string[] = []
	meta = meta.replace(/(?:\s|^)(?:([a-zA-Z]+)\s*=\s*)?([/"'])(.*?)(?<!\\)\2(?=\s|$)/g, (match, prefix, delimiter, expression) => {
		if (prefix && !MarkerTypeOrder.includes(prefix)) return match
		inlineMarkings.push(`${prefix || 'mark'}=${delimiter}${expression}${delimiter}`)
		return ''
	})

	return {
		title,
		lineMarkings,
		inlineMarkings,
		meta,
	}
}
