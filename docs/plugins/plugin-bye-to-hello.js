// @ts-check

/** @returns {import('@expressive-code/core').ExpressiveCodePlugin} */
export function pluginByeToHello() {
	return {
		name: 'Bye to Hello',
		hooks: {
			// Add an example hook that replaces the first occurrence
			// of the word "bye" with "hello" in any code block
			preprocessCode: (context) => {
				// Only apply this to code blocks with the `bye-to-hello` meta
				if (!context.codeBlock.meta.includes('bye-to-hello')) return

				context.codeBlock.getLines().forEach((line) => {
					const word = 'bye'
					const from = line.text.indexOf(word)
					if (from !== -1) {
						const to = from + word.length
						line.editText(from, to, 'hello')
					}
				})
			},
		},
	}
}
