import { escapeRegExp } from '../internal/escaping'

export type ReplaceDelimitedValuesMatch = {
	fullMatch: string
	key: string
	value: string
	valueStartDelimiter: string
	valueEndDelimiter: string
}

export type ReplaceDelimitedValuesSyntax = {
	/**
	 * An array defining all strings allowed as value delimiters, which indicate
	 * the start & end of a value inside the processed string.
	 *
	 * By default, the same delimiter must be used to start and end a value,
	 * so `['"', "'"]` would detect values delimited with `"double"` and `'single'`,
	 * but not `"mixed'` quotes.
	 *
	 * If you want to use a different delimiter to end a value,
	 * specify the start and end delimiter pair separated by three dots.
	 * For example, `['{...}']` would detect values delimited `{like this}`.
	 */
	valueDelimiters: string[]
	keyValueSeparator: string
}

export function replaceDelimitedValues(
	/** The input string. */
	input: string,
	/**
	 * This function gets called on every match.
	 *
	 * It is expected to return the replacement string for the match.
	 */
	replacer: (match: ReplaceDelimitedValuesMatch) => string,
	/**
	 * Optional syntax settings that determine how values are delimited,
	 * and how keys and values are separated from each other.
	 */
	syntax: ReplaceDelimitedValuesSyntax = {
		valueDelimiters: ['"', "'"],
		keyValueSeparator: '=',
	}
) {
	let result = input

	const valueDelimiterPairs = syntax.valueDelimiters.map((valueDelimiter) => {
		const parts = valueDelimiter.split('...')
		const isPair = parts.length === 2
		return {
			valueStartDelimiter: isPair ? parts[0] : valueDelimiter,
			valueEndDelimiter: isPair ? parts[1] : valueDelimiter,
		}
	})

	valueDelimiterPairs.forEach(({ valueStartDelimiter, valueEndDelimiter }) => {
		const regExp = new RegExp(
			[
				// Whitespace or start of string
				`(?:\\s|^)`,
				// Optional group for key name and key/value separator
				[
					// Start of non-capturing optional group
					`(?:`,
					// Key name (captured)
					`([^\\s"'${escapeRegExp(syntax.keyValueSeparator.replace(/-/g, '\\-'))}]+)`,
					// Optional whitespace
					`\\s*`,
					// Key/value separator (e.g. `=`)
					escapeRegExp(syntax.keyValueSeparator),
					// Optional whitespace
					`\\s*`,
					// End of non-capturing optional group
					`)?`,
				],
				// Value start delimiter
				escapeRegExp(valueStartDelimiter),
				// Value string (captured, can be an empty string)
				`(.*?)`,
				// Value end delimiter that is not escaped by a preceding `\`
				`(?<!\\\\)${escapeRegExp(valueEndDelimiter)}`,
				// Whitespace or end of string
				`(?=\\s|$)`,
			]
				.flat()
				.join(''),
			'g'
		)
		result = result.replace(
			regExp,
			// Process the current match along with its capture group string contents
			// by calling the given replacer function and returning its result
			(fullMatch: string, key: string, value: string) => {
				return replacer({ fullMatch, key, value, valueStartDelimiter, valueEndDelimiter })
			}
		)
	})

	return result
}
