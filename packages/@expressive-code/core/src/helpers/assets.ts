export type CreateInlineSvgUrlOptions = {
	/**
	 * Whether to keep the original size of the SVG image.
	 *
	 * By default, any `width` and `height` attributes inside the SVG tag are removed.
	 *
	 * @default false
	 */
	keepSize?: boolean | undefined
}

/**
 * Creates an inline SVG image data URL from the given contents of an SVG file.
 *
 * You can use it to embed SVG images directly into your plugin's styles or HAST.
 *
 * The optional `options` argument allows further customization of the generated URL.
 */
export function createInlineSvgUrl(svgContents: string | string[], options: CreateInlineSvgUrlOptions = {}): string {
	const { keepSize = false } = options
	let svgString = Array.isArray(svgContents) ? svgContents.join('') : svgContents
	// Process attributes inside the svg tag
	svgString = svgString.replace(/^\s*(<svg)\s+([^>]+)\s*(\/?>)/, (match, tagStart, attrs, tagEnd) => {
		if (typeof attrs !== 'string') return match
		if (!keepSize) attrs = attrs.replaceAll(/(?:width|height)\s*=\s*(?:(["'])[\w\s]*\1|\d+)\s*/g, '')
		return `${tagStart} ${attrs}${tagEnd}`
	})
	return `url("data:image/svg+xml,${encodeURIComponent(svgString)}")`
}
