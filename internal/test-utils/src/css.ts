import postcss, { Root, Rule, Declaration } from 'postcss'

export function parseCss(css: string): Root {
	// @ts-expect-error PostCSS has incorrect types when using exactOptionalPropertyTypes
	// eslint-disable-next-line redundant-undefined/redundant-undefined
	const postCssOptions: { from?: string } = { from: undefined }

	return postcss.parse(css, postCssOptions)
}

export function findRulesBySelector(cssRoot: Root, selector: string | RegExp) {
	const matches: Rule[] = []

	cssRoot.walkRules((rule) => {
		if (selector instanceof RegExp ? rule.selector.match(selector) : rule.selector === selector) {
			matches.push(rule)
		}
	})

	return matches
}

export function findDeclsByProperty(rule: Rule, propertyName: string | RegExp) {
	const decls: Declaration[] = []

	rule.walkDecls((decl) => {
		if (propertyName instanceof RegExp ? decl.prop.match(propertyName) : decl.prop === propertyName) {
			decls.push(decl)
		}
	})

	return decls
}

export function findDeclsBySelectorAndProperty(cssRoot: Root, selector: string | RegExp, propertyName: string | RegExp) {
	const rules = findRulesBySelector(cssRoot, selector)
	return rules.flatMap((rule) => findDeclsByProperty(rule, propertyName))
}
