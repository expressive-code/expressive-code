import { escapeRegExp } from '../internal/escaping'

export type PropsSyntax = {
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

export type ParsedProp = { index: number; raw: string; key: string | undefined; valueStartDelimiter: string; valueEndDelimiter: string } & (
	| { kind: 'string'; value: string }
	| { kind: 'range'; value: string }
	| { kind: 'regexp'; value: RegExp }
	| { kind: 'boolean'; value: boolean }
)

export type PropHandlerFn = (option: ParsedProp) => boolean

export function parseProps(
	input: string,
	syntax: PropsSyntax = {
		valueDelimiters: ["'", '"', '/', '{...}'],
		keyValueSeparator: '=',
	}
): ParsedProp[] {
	const parsedProps: ParsedProp[] = []

	// Parse delimited values first and remove them from the input string
	const delimitedValues = parseDelimitedValues(input, syntax)
	let inputWithoutDelimited = input
	delimitedValues.forEach(({ index, fullMatch: raw, key, value, valueStartDelimiter, valueEndDelimiter }) => {
		inputWithoutDelimited = inputWithoutDelimited.slice(0, index) + ' '.repeat(raw.length) + inputWithoutDelimited.slice(index + raw.length)
		// Handle regular expressions
		if (valueStartDelimiter === '/') {
			let regExp: RegExp | undefined
			try {
				// Try to use regular expressions with capture group indices
				regExp = new RegExp(value, 'gd')
				/* c8 ignore start */
			} catch (error) {
				// Use fallback if unsupported
				regExp = new RegExp(value, 'g')
			}
			/* c8 ignore stop */
			parsedProps.push({
				index,
				raw,
				kind: 'regexp',
				key,
				value: regExp,
				valueStartDelimiter,
				valueEndDelimiter,
			})
			return
		}
		// Handle ranges
		if (valueStartDelimiter === '{') {
			parsedProps.push({
				index,
				raw,
				kind: 'range',
				key,
				value,
				valueStartDelimiter,
				valueEndDelimiter,
			})
			return
		}
		// Treat all other props as strings
		parsedProps.push({
			index,
			raw,
			kind: 'string',
			key,
			value,
			valueStartDelimiter,
			valueEndDelimiter,
		})
	})

	// Now parse all remaining props
	const escapedSeparator = escapeRegExp(syntax.keyValueSeparator).replace(/-/g, '\\-')
	const regExp = new RegExp(`([^\\s${escapedSeparator}]+)(?:\\s*${escapedSeparator}\\s*(\\S+))?`, 'g')
	const simpleProps = [...inputWithoutDelimited.matchAll(regExp)]
	simpleProps.forEach((match) => {
		const index = match.index ?? 0
		const [raw, key, value] = match

		if (value === 'true' || value === 'false' || value === undefined) {
			// Handle booleans
			parsedProps.push({
				index,
				raw,
				kind: 'boolean',
				key,
				value: value !== 'false',
				valueStartDelimiter: '',
				valueEndDelimiter: '',
			})
		} else {
			// Treat all other props as string props
			parsedProps.push({
				index,
				raw,
				kind: 'string',
				key,
				value,
				valueStartDelimiter: '',
				valueEndDelimiter: '',
			})
		}
	})

	// Sort props by their index in the input string
	parsedProps.sort((a, b) => a.index - b.index)

	return parsedProps
}

export function handleProps(input: string, handler: PropHandlerFn, syntax?: PropsSyntax): string {
	// Parse props and call the handler on each of them, remembering the handled ones
	const props = parseProps(input, syntax)
	const rangesToRemove: { start: number; end: number }[] = []
	props.forEach((prop) => {
		const { index, raw } = prop
		if (handler(prop)) {
			rangesToRemove.push({
				start: index,
				end: index + raw.length,
			})
		}
	})
	// Now remove the handled props from the input and return the rest
	let result = input
	for (let i = rangesToRemove.length - 1; i >= 0; i--) {
		const { start, end } = rangesToRemove[i]
		result = result.slice(0, start) + result.slice(end)
	}
	return result
}

function parseDelimitedValues(input: string, syntax: PropsSyntax): DelimitedValuesMatch[] {
	const valueDelimiterPairs = syntax.valueDelimiters.map((valueDelimiter) => {
		const parts = valueDelimiter.split('...')
		const isPair = parts.length === 2
		return {
			valueStartDelimiter: isPair ? parts[0] : valueDelimiter,
			valueEndDelimiter: isPair ? parts[1] : valueDelimiter,
		}
	})
	const singleCharValueDelimiters = valueDelimiterPairs
		.map((pair) => pair.valueStartDelimiter)
		.filter((delimiter) => delimiter.length === 1)
		.join('')

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
				`([^\\s${escapeRegExp((singleCharValueDelimiters + syntax.keyValueSeparator).replace(/-/g, '\\-'))}]+)`,
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

	// Now use the regular expression to find all matches
	const matches = [...input.matchAll(regExp)]

	return matches.map((match) => {
		const [fullMatch, ...keyValuePairs] = match

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

		return {
			index: match.index ?? 0,
			fullMatch,
			key,
			value,
			valueStartDelimiter,
			valueEndDelimiter,
		}
	})
}

type DelimitedValuesMatch = {
	index: number
	fullMatch: string
	key: string
	value: string
	valueStartDelimiter: string
	valueEndDelimiter: string
}
