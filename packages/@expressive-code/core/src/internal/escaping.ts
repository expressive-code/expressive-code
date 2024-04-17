export function escapeRegExp(input: string) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Serializes the given value as a CSS string value that can be used in `content` or a CSS variable.
 *
 * Special characters are escaped, and the result is wrapped in single or double quotes.
 */
export function serializeCssStringValue(value: string, quoteStyle: 'single' | 'double' = 'single') {
	const quote = quoteStyle === 'single' ? "'" : '"'
	const escapedValue = Array.from(value)
		.map((char) => {
			const code = char.charCodeAt(0)
			switch (true) {
				// Use replacement character for NULL
				case code === 0x0000:
					return '\uFFFD'
				// Escape U+0001 to U+001F and U+007F as code point
				case (code >= 0x0001 && code <= 0x001f) || code === 0x007f:
					return `\\${code.toString(16)} `
				// Escape nested quotes and backslashes
				case char === quote || char === '\\':
					return `\\${char}`
				// Use all other characters directly
				default:
					return char
			}
		})
		.join('')
	return `${quote}${escapedValue}${quote}`
}
