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

	// Build a regular expression that contains alternatives for all value delimiters
	const regExpParts = valueDelimiterPairs.map(({ valueStartDelimiter, valueEndDelimiter }) => {
		const part = [
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
			// Value string (captured, can be an empty string),
			// consisting of any of the following parts:
			// - any character that is not a backslash
			// - a backslash followed by any character
			`((?:[^\\\\]|\\\\.)*?)`,
			// Value end delimiter that is not escaped by a preceding `\`
			`${escapeRegExp(valueEndDelimiter)}`,
			// Whitespace or end of string
			`(?=\\s|$)`,
		]
		return part.flat().join('')
	})
	const regExp = new RegExp(regExpParts.join('|'), 'g')

	// Now use the regular expression to find and replace all matches
	result = result.replace(
		regExp,
		// Process the current match along with its capture group string contents
		// by calling the given replacer function and returning its result
		(fullMatch: string, ...keyValuePairs: string[]) => {
			// Determine which value delimiter pair was used for this match
			// by looking for the first defined value in the capture group array
			// (matches can have no key, so the found capture group can either be a key or a value,
			// but as they come in pairs, a division by 2 will give us the delimiter pair index)
			const firstCaptureGroupIndex = keyValuePairs.findIndex((value) => value !== undefined)
			const delimiterPairIdx = Math.floor(firstCaptureGroupIndex / 2)
			const { valueStartDelimiter, valueEndDelimiter } = valueDelimiterPairs[delimiterPairIdx]
			// Also retrieve the actual matched key and value
			const [key, escapedValue] = keyValuePairs.slice(delimiterPairIdx * 2, delimiterPairIdx * 2 + 2)
			// Unescape value by removing any backslash that escapes any of the following:
			// - another backslash (e.g. `\\` becomes `\`)
			// - the value end delimiter (e.g. `\"` becomes `"`)
			// Any other backslashes are kept because users may not know
			// that they need to be escaped in the first place.
			const escapedBackslashOrValueEndDelimiter = new RegExp(`\\\\(\\\\|${escapeRegExp(valueEndDelimiter)})`, 'g')
			const value = escapedValue.replace(escapedBackslashOrValueEndDelimiter, '$1')
			// Call the replacer function with the match details
			return replacer({ fullMatch, key, value, valueStartDelimiter, valueEndDelimiter })
		}
	)

	return result
}

/**
 * Retrieves all group indices from the given RegExp match. Group indices are ranges
 * defined by start & end positions. The first group index refers to the full match,
 * and the following indices to RegExp capture groups (if any).
 *
 * If the RegExp flag `d` was enabled (and supported), it returns the native group indices.
 *
 * Otherwise, it uses fallback logic to manually search for the group contents inside the
 * full match. Note that this can be wrong if a group's contents can be found multiple times
 * inside the full match, but that's probably a rare case and still better than failing.
 */
export function getGroupIndicesFromRegExpMatch(match: RegExpMatchArray) {
	// Read the start and end ranges from the `indices` property,
	// which is made available through the RegExp flag `d`
	let groupIndices = match.indices as ([start: number, end: number] | null)[]
	if (groupIndices?.length) return groupIndices

	// We could not access native group indices, so we need to use fallback logic
	// to find the position of each capture group match inside the full match
	const fullMatchIndex = match.index as number
	groupIndices = match.map((groupValue) => {
		const groupIndex = groupValue ? match[0].indexOf(groupValue) : -1
		if (groupIndex === -1) return null
		const groupStart = fullMatchIndex + groupIndex
		const groupEnd = groupStart + groupValue.length
		return [groupStart, groupEnd]
	})

	return groupIndices
}
