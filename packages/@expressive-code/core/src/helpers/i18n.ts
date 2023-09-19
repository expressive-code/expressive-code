/**
 * Formats a string template by replacing all placeholders with the given variables.
 *
 * Simple placeholders are written as variable names in curly brackets, e.g. `{variableName}`.
 *
 * You can also use conditional placeholders by separating multiple choices with semicolons
 * and optionally adding a condition before each choice, e.g.
 * `{itemCount;1=item;items}` or `{variableName; 0=zero; >0=positive; negative}`.
 *
 * The first choice that matches the condition will be used. There must always be exactly
 * one catch-all choice without a condition.
 */
export function formatTemplate(template: string, variables: { [key: string]: string | number }) {
	const getReplacement = (varName: string, ...choices: string[]) => {
		const value = variables[varName]
		if (value === undefined)
			throw new Error(`Unknown variable name "${varName}" found in string template "${template}". Available variables: ${JSON.stringify(Object.keys(variables))}`)
		if (!choices.length) return value.toString()
		const parsedChoices: { condition?: { operator: string; number: number } | undefined; text: string }[] = choices.map((choice) => {
			const condition = choice.match(/^\s*(<|>|)\s*(-?[0-9.]+?)\s*=\s?/)
			if (!condition) return { text: choice.replace(/^\s/, '') }
			const [fullMatch, operator, conditionValue] = condition

			const number = Number.parseFloat(conditionValue)
			if (isNaN(number)) throw new Error(`Expected condition value "${conditionValue}" to be a number in string template "${template}".`)
			if (typeof value !== 'number')
				throw new Error(
					`Condition "${operator}${conditionValue}" in string template "${template}" requires variable "${varName}" to be a number, but it's ${JSON.stringify(value)}.`
				)

			return {
				condition: {
					operator: operator || '=',
					number,
				},
				text: choice.slice(fullMatch.length),
			}
		})
		const catchAllCount = parsedChoices.filter((choice) => !choice.condition).length
		if (catchAllCount !== 1) throw new Error(`Expected exactly 1 catch-all choice for variable "${varName}", but found ${catchAllCount} in string template "${template}".`)
		for (const { condition, text } of parsedChoices) {
			if (!condition) return text
			if (typeof value !== 'number') continue
			const conditionIsMatching =
				// Less than
				(condition.operator === '<' && value < condition.number) ||
				// Greater than
				(condition.operator === '>' && value > condition.number) ||
				// Equals
				(condition.operator === '=' && value === condition.number)
			if (conditionIsMatching) return text
		}
		return ''
	}

	// Temporarily replace escaped curly brackets
	let result = template
	result = result.replace(/(?<!\\)\\{/g, '\f(').replace(/(?<!\\)\\}/g, '\f)')
	// Replace escaped escape characters with a single escape
	result = result.replace(/\\(\\[{}])/g, '$1')

	// Replace all placeholders until no more are found
	const innermostPlaceholderRegex = /\{([^{]*?)\}/g
	let keepGoing = true
	while (keepGoing) {
		keepGoing = false
		result = result.replace(innermostPlaceholderRegex, (match: string, contents: string) => {
			keepGoing = true
			const [varName, ...choices] = contents.split(';')
			return getReplacement(varName, ...choices)
				.replace(/{/g, '\f(')
				.replace(/}/g, '\f)')
		})
	}

	// Revert replaced escaped curly brackets with regular ones
	result = result.replace(/\f\(/g, '{').replace(/\f\)/g, '}')

	return result
}
