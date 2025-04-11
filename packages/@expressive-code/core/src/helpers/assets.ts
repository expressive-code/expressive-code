/**
 * Creates an inline SVG image data URL from the given contents of an SVG file.
 *
 * You can use it to embed SVG images directly into your plugin's styles or HAST.
 */
export function createInlineSvgUrl(svgContents: string | string[]) {
	const svgString = Array.isArray(svgContents) ? svgContents.join('') : svgContents
	return `url("data:image/svg+xml,${encodeURIComponent(svgString)}")`
}
