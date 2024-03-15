import fs from 'node:fs'
import { EOL } from 'node:os'

export function normalizeLineEndings(contents: string) {
	return contents.replace(/\r\n/g, '\n')
}

export function splitLines(contents: string) {
	return normalizeLineEndings(contents).split(/\n/)
}

export function readFileLines(filePath: string) {
	return splitLines(fs.readFileSync(filePath, 'utf8'))
}

export function writeFileLines(filePath: string, lines: string | string[]) {
	const normalizedLines = splitLines(Array.isArray(lines) ? lines.join('\n') : lines)
	fs.writeFileSync(filePath, normalizedLines.join(EOL))
}

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
