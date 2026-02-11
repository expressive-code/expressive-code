/**
 * Returns the number of leading whitespace columns in a line of text.
 *
 * Used by rendering and annotation integrations to align generated output
 * with the indentation of source lines.
 */
export function getLeadingWhitespaceColumns(text: string) {
	return text.match(/^\s*/)?.[0].length ?? 0
}
