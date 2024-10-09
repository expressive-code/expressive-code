const parensAnyStyle = `()<>{}\\[\\]`
const nonParensAnyStyle = `[^\\s${parensAnyStyle}]`
const nonParensOrPunctuation = `[^\\s${parensAnyStyle}\`!;:'\\".,?«»“”‘’]`
const nonRoundParens = `[^\\s()]`
const balancedRoundParens = `\\([^\\s]+?\\)`
const balancedRoundParensNested = `\\(${nonRoundParens}*?\\(${nonRoundParens}+\\)${nonRoundParens}*?\\)`

export const autolinkRegExp = new RegExp(
	[
		`\\b`,
		// Capture #1: Scheme, colon, and slashes
		`(https?:\\/{1,3})`,
		// Capture #2: Host, path, query string and fragment
		`(`,
		// Domain name or IP address
		`(?:[\\w.\\-]+)`,
		`\\b`,
		`\\/?`,
		// Optional path and query string
		// Any sequence of:
		`(?:${nonParensAnyStyle}+|${balancedRoundParensNested}|${balancedRoundParens})*`,
		// Optionally ending with any of:
		`(?:${balancedRoundParensNested}|${balancedRoundParens}|${nonParensOrPunctuation})?`,
		// End of capture #2
		`)`,
	].join(''),
	'ig'
)
