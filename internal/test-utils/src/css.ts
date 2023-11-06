import postcss, { Root, Rule, Declaration, AtRule } from 'postcss'
import { StyleSettingPath, getCssVarName } from '@expressive-code/core'

export type SimplifiedDeclaration = {
	prop: string
	value: string
	/**
	 * The selector of the parent rule that contains the declaration.
	 *
	 * For example, the selector of `.foo { color: red }` would be `.foo`.
	 */
	selector: string
	/**
	 * CSS rules can be nested inside other rules (e.g. at-rules). This array contains
	 * the full hierarchy of nested selectors, starting at the top level.
	 *
	 * For example, a CSS input of
	 * ```css
	 * `@media (hover: hover) { a { color: red } }`
	 * ```
	 * would result in this value:
	 * ```js
	 * ['@media (hover: hover)', 'a']
	 * ```
	 */
	nestedSelectors: string[]
}

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

export function findDeclsByProperty(container: Root | Rule, propertyName: string | RegExp): SimplifiedDeclaration[] {
	const decls: Declaration[] = []

	container.walkDecls((decl) => {
		if (propertyName instanceof RegExp ? decl.prop.match(propertyName) : decl.prop === propertyName) {
			decls.push(decl)
		}
	})

	return simplifyDecls(decls)
}

export function findDeclsByStyleSetting(container: Root | Rule, styleSettings: StyleSettingPath | StyleSettingPath[]): SimplifiedDeclaration[] {
	const settingsArray = styleSettings instanceof Array ? styleSettings : [styleSettings]
	const pathRegExp = new RegExp(`^${settingsArray.map(getCssVarName).join('|')}$`)
	return findDeclsByProperty(container, pathRegExp)
}

export function findDeclsBySelectorAndProperty(cssRoot: Root, selector: string | RegExp, propertyName: string | RegExp): SimplifiedDeclaration[] {
	const rules = findRulesBySelector(cssRoot, selector)
	return rules.flatMap((rule) => findDeclsByProperty(rule, propertyName))
}

function simplifyDecls(decls: Declaration[]) {
	return decls.map(({ prop, value, parent }) => {
		const nestedSelectors: string[] = []
		while (parent?.type === 'rule' || parent?.type === 'atrule') {
			const parentRuleOrAtRule = parent as Rule | AtRule
			const selector = parentRuleOrAtRule.type === 'rule' ? parentRuleOrAtRule.selector : `@${parentRuleOrAtRule.name} ${parentRuleOrAtRule.params}`
			nestedSelectors.unshift(selector)
			parent = parentRuleOrAtRule.parent
		}
		return { prop, value, selector: nestedSelectors[nestedSelectors.length - 1], nestedSelectors }
	})
}
