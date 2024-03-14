/**
 * String-only alternative to `JSON.stringify` that uses single quotes instead of double quotes.
 */
export function serializeStringWithSingleQuotes(input: string): string {
	const escapedString: string = input.replace(/(['\\\n\r\t])/g, (match) => {
		const escapeMap: { [char: string]: string } = {
			"'": "\\'",
			'\\': '\\\\',
			'\n': '\\n',
			'\r': '\\r',
			'\t': '\\t',
		}

		return escapeMap[match] || match
	})

	return `'${escapedString}'`
}
