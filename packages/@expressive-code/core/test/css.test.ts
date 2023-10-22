import { describe, expect, test } from 'vitest'
import { annotateMatchingTextParts, getHookTestResult, getMultiHookTestResult } from './utils'
import { groupWrapperClassName } from '../src/internal/css'

const groupWrapperScope = `.${groupWrapperClassName}`

describe('Processes CSS styles added by plugins', () => {
	test('Throws on invalid styles', async () => {
		await expect(async () => {
			await getHookTestResult('postprocessRenderedLine', ({ addStyles }) => {
				addStyles(`.invalid { color: red;`)
			})
		}).rejects.toThrow(/TestPlugin.*color: red/)
	})
	describe('Scopes styles to prevent leaking out', () => {
		test('Adds a scope to top-level rules', async () => {
			await expectResultStyles(`color: red`, `#GRP{color:red}`)
		})
		test('Adds a scope to unscoped styles', async () => {
			await expectResultStyles(`del{color:red}`, `#GRP del{color:red}`)
		})
		test('Leaves already scoped styles unchanged', async () => {
			await expectResultStyles(`${groupWrapperScope} del{color:red}`, `#GRP del{color:red}`)
		})
		test('Allows unscoped CSS by targeting :root, html or body', async () => {
			await expectResultStyles(
				[
					// Add a style targeting top-level elements
					`:root,body,html{--ec-del-text:red}`,
					// Add a style scoped to the default wrapper class name
					`${groupWrapperScope}{--ec-del-text:purple}`,
					// Add an unscoped style
					`del{color:var(--ec-del-text)}`,
				],
				[
					// Expect top-level style not to be scoped
					`:root,body,html{--ec-del-text:red}`,
					// Expect pre-scoped style to still be scoped to the default wrapper class
					`#GRP{--ec-del-text:purple}`,
					// Expect unscoped style to be scoped to the config class name
					`#GRP del{color:var(--ec-del-text)}`,
				]
			)
		})
	})
	describe('Minifies styles', () => {
		test('Removes whitespace before, after and between rules', async () => {
			await expectResultStyles(
				`
				
					del{color:red}


					ins{display:block}

				`,
				`#GRP del{color:red}#GRP ins{display:block}`
			)
		})
		test('Removes whitespace between multiple selectors', async () => {
			await expectResultStyles(`del,  \n   ins{color:red}`, `#GRP del,#GRP ins{color:red}`)
		})
		test('Removes whitespace between selectors and opening bracket', async () => {
			await expectResultStyles(`del  \n  {color:red}`, `#GRP del{color:red}`)
		})
		test('Removes whitespace after opening bracket', async () => {
			await expectResultStyles(`del{  color:red}`, `#GRP del{color:red}`)
		})
		test('Removes whitespace between declaration properties and values', async () => {
			await expectResultStyles(`del{color  :  red}`, `#GRP del{color:red}`)
		})
		test('Removes whitespace between declarations', async () => {
			await expectResultStyles(`del{display:block  ;  color:red}`, `#GRP del{display:block;color:red}`)
		})
		test('Removes whitespace before closing bracket', async () => {
			await expectResultStyles(`del{color:red  }`, `#GRP del{color:red}`)
		})
		test('Removes last semicolon before closing bracket', async () => {
			await expectResultStyles(`del{display:block;color:red;}`, `#GRP del{display:block;color:red}`)
		})
		test.skip('Removes whitespace inside multi-part selectors', async () => {
			await expectResultStyles(`del > mark{color:red}`, `#GRP del>mark{color:red}`)
		})
		test('Removes comments', async () => {
			await expectResultStyles(
				`
					/*
						This is a comment
						on multiple lines
					*/
					ins {color:red;/* another comment */}
				`,
				`#GRP ins{color:red}`
			)
		})
	})
	describe('Allows SASS-like nesting', () => {
		test('Simple nesting', async () => {
			await expectResultStyles(
				`
					.some-class {
						ins,mark { color: yellow }
					}
				`,
				`#GRP .some-class ins,#GRP .some-class mark{color:yellow}`
			)
		})
		test('Targeting the group wrapper', async () => {
			await expectResultStyles(
				`
					& {
						color: blue
					}
				`,
				`#GRP{color:blue}`
			)
		})
		test('Compound selectors', async () => {
			await expectResultStyles(
				`
					mark {
						&.new { color: blue }
					}
				`,
				`#GRP mark.new{color:blue}`
			)
		})
		test('Direct child selectors', async () => {
			await expectResultStyles(
				`
					mark {
						> p { color: blue }
					}
				`,
				`#GRP mark>p{color:blue}`,
				// Note: We're allowing spaces around the child selector here
				// because we cannot remove whitespace in multi-part selectors yet
				(style) => style.replace(/mark\s*>\s*p/, 'mark>p')
			)
		})
		test('Leaves styles scoped through nesting unchanged', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					${groupWrapperScope} { ins {color:red;/* another comment */} }
				`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} ins{color:red}`]))
		})
		test('Allows selectors to remain unscoped by nesting in :root, html or body', async () => {
			await expectResultStyles(
				`
					:root,
					body,
					html {
						ins { color: green }
					}
				`,
				`:root ins,body ins,html ins{color:green}`
			)
		})
		test('Allows selectors to break out of nesting chain using @at-root', async () => {
			await expectResultStyles(
				`
					@at-root {
						mark {
							body &, html & { color: blue }
						}
					}
				`,
				`body mark,html mark{color:blue}`
			)
		})
	})
	describe(`Doesn't break nested CSS features`, () => {
		test('@media', async () => {
			await expectResultStyles(
				`
					code {
						@media (min-width:50em) {
							:root {
								--min-spacing-inline: calc(0.5vw-1.5rem);
								color:blue;
							}
							body, html {
								color: green;
							}
							.test {
								color: red
							}
						}
					}
				`,
				`@media (min-width:50em){:root{--min-spacing-inline:calc(0.5vw-1.5rem);color:blue}body,html{color:green}#GRP code .test{color:red}}`
			)
		})
		test('@supports', async () => {
			await expectResultStyles(
				`
					@supports (height:100dvh) {
						:root {
							--cur-viewport-height: 100dvh;
						}
						del {
							color: purple;
						}
					}
				`,
				`@supports (height:100dvh){:root{--cur-viewport-height:100dvh}#GRP del{color:purple}}`
			)
		})
		test('@keyframes', async () => {
			await expectResultStyles(
				`
					@keyframes slidein {
						from {
							transform: translateX(0%);
						}

						to {
							transform: translateX(100%);
						}
					}
				`,
				`@keyframes slidein{from{transform:translateX(0%)}to{transform:translateX(100%)}}`
			)
		})
	})
	describe('Deduplicates styles', () => {
		test('When duplicates are added by a single hook', async () => {
			await expectResultStyles(
				[
					`del { color: red; }`,
					`${groupWrapperScope} ins { color: green; }`,
					// This is added twice
					`del { color: red; }`,
				],
				[
					// Expect deduplicated, scoped and minified styles
					`#GRP del{color:red}`,
					`#GRP ins{color:green}`,
				]
			)
		})
		test('When duplicates are added across hooks', async () => {
			const { styles } = await getMultiHookTestResult({
				hooks: {
					preprocessMetadata: ({ codeBlock, addStyles }) => {
						annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
						addStyles(`${groupWrapperScope} del { color: red; }`)
						addStyles(`
							/* some comment here */
							${groupWrapperScope} ins { color: green; }
						`)
						addStyles(`${groupWrapperScope} del { color: red; }`)
					},
					postprocessRenderedBlock: ({ addStyles }) => {
						addStyles(`${groupWrapperScope} ins { color: green; }`)
					},
					postprocessRenderedBlockGroup: ({ addStyles }) => {
						addStyles(`${groupWrapperScope} ins { color: green; }`)
						addStyles(`${groupWrapperScope} a { color: blue; }`)
						addStyles(`${groupWrapperScope} del { color: red; }`)
					},
				},
			})
			expect(styles).toEqual(
				new Set([
					// Expect deduplicated, scoped and minified styles
					`${groupWrapperScope} del{color:red}`,
					`${groupWrapperScope} ins{color:green}`,
					`${groupWrapperScope} a{color:blue}`,
				])
			)
		})
	})
})

async function expectResultStyles(input: string | string[], expected: string | string[], postprocessStyle?: (style: string) => string) {
	const arrInput = Array.isArray(input) ? input : [input]
	const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
		arrInput.forEach((input) => addStyles(input))
	})
	const arrExpected = Array.isArray(expected) ? expected : [expected]
	const arrScopedExpected = arrExpected.map((style) => style.replace(/#GRP/g, groupWrapperScope))
	const postprocessedStyles = postprocessStyle ? new Set([...styles].map((style) => postprocessStyle(style))) : styles
	expect(postprocessedStyles).toEqual(new Set(arrScopedExpected))
}
