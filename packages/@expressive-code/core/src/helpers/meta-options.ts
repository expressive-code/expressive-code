import { escapeRegExp } from '../internal/escaping'

export class MetaOptions {
	constructor(input: string) {
		const { options, errors } = parseOptions(input)
		this.#parsedOptions = options
		this.#errors = errors.length ? errors : undefined
	}

	#parsedOptions: MetaOption[]
	#errors: string[] | undefined

	/**
	 * A list of error messages that occurred when parsing the meta string,
	 * or `undefined` if no errors occurred.
	 */
	get errors() {
		return this.#errors
	}

	/**
	 * Returns a list of meta options, optionally filtered by their key and/or {@link MetaOptionKind}.
	 *
	 * @param keyOrKeys
	 * Allows to filter the options by key. An empty string will return options without a key.
	 * A non-empty string will return options with a matching key (case-insensitive).
	 * An array of strings will return options with any of the matching keys.
	 * If omitted, no key-based filtering will be applied.
	 *
	 * @param kind
	 * Allows to filter the options by {@link MetaOptionKind}.
	 * If omitted, no kind-based filtering will be applied.
	 */
	list<K extends MetaOptionKind | undefined = undefined>(keyOrKeys?: string | string[], kind?: K) {
		type ReturnType = K extends MetaOptionKind ? Extract<MetaOption, { kind: K }>[] : MetaOption[]
		const filtered = this.#parsedOptions.filter((option) => {
			if (kind !== undefined && option.kind !== kind) return false
			if (keyOrKeys === undefined) return true
			const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]
			return keys.some((key) => (key === '' && !option.key) || option.key?.toLowerCase() === key.toLowerCase())
		}) as ReturnType
		return filtered
	}

	value<K extends MetaOptionKind | undefined = undefined>(key: string, kind?: K) {
		if (!key) throw new Error('You must specify a non-empty key when using getString, getRange, getRegExp or getBoolean.')
		type OptionType = K extends MetaOptionKind ? Extract<MetaOption, { kind: K }> : MetaOption
		return this.list(key, kind)?.pop()?.value as OptionType['value'] | undefined
	}

	/**
	 * Returns the last string value with the given key (case-insensitive),
	 * or without a key by passing an empty string.
	 */
	getString(key: string) {
		return this.value(key, 'string')
	}

	/**
	 * Returns an array of all string values with the given keys (case-insensitive),
	 * or without a key by passing an empty string.
	 */
	getStrings(keyOrKeys?: string | string[]) {
		return this.list(keyOrKeys, 'string')?.map((option) => option.value)
	}

	/**
	 * Returns the last range value (`{value}`) with the given key (case-insensitive),
	 * or without a key by passing an empty string.
	 */
	getRange(key: string) {
		return this.value(key, 'range')
	}

	/**
	 * Returns an array of all range values (`{value}`) with the given keys (case-insensitive),
	 * or without a key by passing an empty string.
	 */
	getRanges(keyOrKeys?: string | string[]) {
		return this.list(keyOrKeys, 'range')?.map((option) => option.value)
	}

	/**
	 * Returns the last RegExp value (`/value/`) with the given key (case-insensitive),
	 * or without a key by passing an empty string.
	 */
	getRegExp(key: string) {
		return this.value(key, 'regexp')
	}

	/**
	 * Returns an array of all RegExp values (`/value/`) with the given keys (case-insensitive),
	 * or without a key by passing an empty string.
	 */
	getRegExps(keyOrKeys?: string | string[]) {
		return this.list(keyOrKeys, 'regexp')?.map((option) => option.value)
	}

	/**
	 * Returns the last boolean value with the given key (case-insensitive).
	 */
	getBoolean(key: string) {
		return this.value(key, 'boolean')
	}
}

export type MetaOptionBase = { index: number; raw: string; key: string | undefined; valueStartDelimiter: string; valueEndDelimiter: string }

export type MetaOptionString = MetaOptionBase & { kind: 'string'; value: string }
export type MetaOptionRange = MetaOptionBase & { kind: 'range'; value: string }
export type MetaOptionRegExp = MetaOptionBase & { kind: 'regexp'; value: RegExp }
export type MetaOptionBoolean = MetaOptionBase & { kind: 'boolean'; value: boolean }

export type MetaOption = MetaOptionString | MetaOptionRange | MetaOptionRegExp | MetaOptionBoolean

export type MetaOptionKind = MetaOption['kind']

function parseOptions(
	input: string,
	syntax: DelimitedValuesSyntax = {
		valueDelimiters: ["'", '"', '/', '{...}'],
		keyValueSeparator: '=',
	}
): { options: MetaOption[]; errors: string[] } {
	const options: MetaOption[] = []
	const errors: string[] = []

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
			} catch (_error) {
				try {
					// Use fallback if unsupported
					regExp = new RegExp(value, 'g')
				} catch (error) {
					/* c8 ignore next */
					const msg = error instanceof Error ? error.message : (error as string)
					errors.push(`Failed to parse option \`${raw.trim()}\`: ${msg}`)
					return
				}
			}
			options.push({
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
			options.push({
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
		// Treat all other options as strings
		options.push({
			index,
			raw,
			kind: 'string',
			key,
			value,
			valueStartDelimiter,
			valueEndDelimiter,
		})
	})

	// Now parse all remaining options
	const escapedSeparator = escapeRegExp(syntax.keyValueSeparator).replace(/-/g, '\\-')
	const regExp = new RegExp(`([^\\s${escapedSeparator}]+)(?:\\s*${escapedSeparator}\\s*(\\S+))?`, 'g')
	const simpleOptions = [...inputWithoutDelimited.matchAll(regExp)]
	simpleOptions.forEach((match) => {
		const index = match.index ?? 0
		const [raw, key, value] = match

		if (value === 'true' || value === 'false' || value === undefined) {
			// Handle booleans
			options.push({
				index,
				raw,
				kind: 'boolean',
				key,
				value: value !== 'false',
				valueStartDelimiter: '',
				valueEndDelimiter: '',
			})
		} else {
			// Treat all other options as strings
			options.push({
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

	// Sort options by their index in the input string
	options.sort((a, b) => a.index - b.index)

	return {
		options,
		errors,
	}
}

function parseDelimitedValues(input: string, syntax: DelimitedValuesSyntax): DelimitedValuesMatch[] {
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

type DelimitedValuesSyntax = {
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

type DelimitedValuesMatch = {
	index: number
	fullMatch: string
	key: string
	value: string
	valueStartDelimiter: string
	valueEndDelimiter: string
}
