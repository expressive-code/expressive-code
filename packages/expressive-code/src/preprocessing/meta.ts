import rangeParser from 'parse-numeric-range'
import { Annotations, InlineMarkingDefinition, LineMarkingDefinition, MarkerType, MarkerTypeOrder } from '../common'

export type PreprocessMetaResult = {
	meta: string
	annotations: Annotations
}

/**
 * Preprocesses the given meta information string and returns contained supported properties.
 *
 * Meta information is the string after the opening code fence and language name.
 */
export function preprocessMeta(meta: string): PreprocessMetaResult {
	// Try to find the meta property `title="..."` or `title='...'`,
	// store its value and remove it from meta
	let title: string | undefined
	meta = meta.replace(/(?:\s|^)title\s*=\s*(["'])(.*?)(?<!\\)\1/, (_, __, content: string) => {
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
	const lineMarkings: LineMarkingDefinition[] = []
	meta = meta.replace(
		/(?:\s|^)(?:([a-zA-Z]+)\s*=\s*)?{([0-9,\s-]*)}/g,
		// Process the current match along with its capture group string contents
		(match: string, prefix: string, range: string) => {
			const markerType = markerTypeFromString(prefix || 'mark')
			if (!markerType) return match

			// Add new line marking definition
			const lines = rangeParser(range)
			lineMarkings.push({
				markerType,
				lines,
			})

			// We handled the current match, so remove it from `meta`
			return ''
		}
	)

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
	const inlineMarkings: InlineMarkingDefinition[] = []
	meta = meta.replace(
		/(?:\s|^)(?:([a-zA-Z]+)\s*=\s*)?([/"'])(.*?)(?<!\\)\2(?=\s|$)/g,
		// Process the current match along with its capture group string contents
		(match: string, prefix: string, delimiter: string, expression: string) => {
			const markerType = markerTypeFromString(prefix || 'mark')
			if (!markerType) return match

			if (delimiter === '/') {
				// Add new regular expression-based inline marking definition
				let regExp: RegExp | undefined
				try {
					// Try to use regular expressions with capture group indices
					regExp = new RegExp(expression, 'gd')
					/* c8 ignore start */
				} catch (error) {
					// Use fallback if unsupported
					regExp = new RegExp(expression, 'g')
				}
				/* c8 ignore stop */
				inlineMarkings.push({
					markerType,
					regExp,
				})
			} else {
				// Add new plaintext-based inline marking definition
				inlineMarkings.push({
					markerType,
					text: expression,
				})
			}

			// We handled the current match, so remove it from `meta`
			return ''
		}
	)

	return {
		meta,
		annotations: {
			title,
			lineMarkings,
			inlineMarkings,
		},
	}
}

/**
 * If the given input string represents a valid marker type,
 * converts it to a {@link MarkerType} and returns it.
 *
 * Otherwise, returns `undefined`.
 */
function markerTypeFromString(input: string) {
	// Fix common marker type mistakes
	if (input === 'add') input = 'ins'
	if (input === 'rem') input = 'del'

	// Return either the converted type or undefined
	const markerType = input as MarkerType
	return MarkerTypeOrder.includes(markerType) ? markerType : undefined
}
