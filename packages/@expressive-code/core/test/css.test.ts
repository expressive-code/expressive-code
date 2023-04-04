import { describe, expect, test } from 'vitest'
import { annotateMatchingTextParts, getHookTestResult, getMultiHookTestResult } from './utils'
import { groupWrapperScope } from '../src/internal/css'

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
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`color: red`)
			})
			// Expect the returned style to be scoped and minified
			expect(styles).toEqual(new Set([`${groupWrapperScope}{color:red}`]))
		})
		test('Adds a scope to unscoped styles', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`del{color:red}`)
			})
			// Expect the returned style to be scoped and minified
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{color:red}`]))
		})
		test('Leaves already scoped styles unchanged', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del{color:red}`)
			})
			// Expect the returned style to be scoped and minified
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{color:red}`]))
		})
		test('Allows unscoped CSS by targeting :root, html or body', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ codeBlock, addStyles }) => {
				annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
				addStyles(':root,body,html{--ec-del-text:red}')
				addStyles('del{color:var(--ec-del-text)}')
			})
			expect(styles).toEqual(
				new Set([
					// Expect some selectors not to be scoped
					':root,body,html{--ec-del-text:red}',
					// Expect the non-root style to be scoped
					`${groupWrapperScope} del{color:var(--ec-del-text)}`,
				])
			)
		})
	})
	describe('Minifies styles', () => {
		test('Removes whitespace before, after and between rules', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
				
					${groupWrapperScope} del{color:red}


					${groupWrapperScope} ins{display:block}

				`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{color:red}${groupWrapperScope} ins{display:block}`]))
		})
		test('Removes whitespace between multiple selectors', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del,  \n   ${groupWrapperScope} ins{color:red}`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del,${groupWrapperScope} ins{color:red}`]))
		})
		test('Removes whitespace between selectors and opening bracket', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del  \n  {color:red}`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{color:red}`]))
		})
		test('Removes whitespace after opening bracket', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del{  color:red}`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{color:red}`]))
		})
		test('Removes whitespace between declaration properties and values', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del{color  :  red}`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{color:red}`]))
		})
		test('Removes whitespace between declarations', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del{display:block  ;  color:red}`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{display:block;color:red}`]))
		})
		test('Removes whitespace before closing bracket', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del{color:red  }`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{color:red}`]))
		})
		test('Removes last semicolon before closing bracket', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del{display:block;color:red;}`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del{display:block;color:red}`]))
		})
		test.skip('Removes whitespace inside multi-part selectors', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`${groupWrapperScope} del > mark{color:red}`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} del>mark{color:red}`]))
		})
		test('Removes comments', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					/*
						This is a comment
						on multiple lines
					*/
					${groupWrapperScope} ins {color:red;/* another comment */}
				`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} ins{color:red}`]))
		})
	})
	describe('Allows SASS-like nesting', () => {
		test('Simple nesting', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					.some-class {
						ins,mark { color: yellow }
					}
				`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} .some-class ins,${groupWrapperScope} .some-class mark{color:yellow}`]))
		})
		test('Targeting the group wrapper', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					& {
						color: blue
					}
				`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope}{color:blue}`]))
		})
		test('Compound selectors', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					mark {
						&.new { color: blue }
					}
				`)
			})
			expect(styles).toEqual(new Set([`${groupWrapperScope} mark.new{color:blue}`]))
		})
		test('Direct child selectors', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					mark {
						> p { color: blue }
					}
				`)
			})
			// Note: We're allowing spaces around the child selector here
			// because we cannot remove whitespace in multi-part selectors yet
			expect([...styles].join('\n').replace(/mark\s*>\s*p/, 'mark>p')).toEqual(`${groupWrapperScope} mark>p{color:blue}`)
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
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					:root,
					body,
					html {
						ins { color: green }
					}
				`)
			})
			expect(styles).toEqual(new Set([`:root ins,body ins,html ins{color:green}`]))
		})
		test('Allows selectors to break out of nesting chain using @at-root', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					@at-root {
						mark {
							body &, html & { color: blue }
						}
					}
				`)
			})
			expect(styles).toEqual(new Set([`body mark,html mark{color:blue}`]))
		})
	})
	describe(`Doesn't break nested CSS features`, () => {
		test('@media', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
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
				`)
			})
			expect(styles).toEqual(
				new Set([`@media (min-width:50em){:root{--min-spacing-inline:calc(0.5vw-1.5rem);color:blue}body,html{color:green}${groupWrapperScope} code .test{color:red}}`])
			)
		})
		test('@supports', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					@supports (height:100dvh) {
						:root {
							--cur-viewport-height: 100dvh;
						}
						del {
							color: purple;
						}
					}
				`)
			})
			expect(styles).toEqual(new Set([`@supports (height:100dvh){:root{--cur-viewport-height:100dvh}${groupWrapperScope} del{color:purple}}`]))
		})
		test('@keyframes', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ addStyles }) => {
				addStyles(`
					@keyframes slidein {
						from {
							transform: translateX(0%);
						}

						to {
							transform: translateX(100%);
						}
					}
				`)
			})
			expect(styles).toEqual(new Set([`@keyframes slidein{from{transform:translateX(0%)}to{transform:translateX(100%)}}`]))
		})
	})
	describe('Deduplicates styles', () => {
		test('When duplicates are added by a single hook', async () => {
			const { styles } = await getHookTestResult('annotateCode', ({ codeBlock, addStyles }) => {
				annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
				addStyles('del { color: red; }')
				addStyles('ins { color: green; }')
				addStyles('del { color: red; }')
			})
			expect(styles).toEqual(
				new Set([
					// Expect deduplicated, scoped and minified styles
					`${groupWrapperScope} del{color:red}`,
					`${groupWrapperScope} ins{color:green}`,
				])
			)
		})
		test('When duplicates are added across hooks', async () => {
			const { styles } = await getMultiHookTestResult({
				hooks: {
					preprocessMetadata: ({ codeBlock, addStyles }) => {
						annotateMatchingTextParts({ line: codeBlock.getLine(1)!, partsToAnnotate: ['two '], selector: 'del' })
						addStyles('del { color: red; }')
						addStyles(`
							/* some comment here */
							ins { color: green; }
						`)
						addStyles('del { color: red; }')
					},
					postprocessRenderedBlock: ({ addStyles }) => {
						addStyles('ins { color: green; }')
					},
					postprocessRenderedBlockGroup: ({ addStyles }) => {
						addStyles('ins { color: green; }')
						addStyles('a { color: blue; }')
						addStyles('del { color: red; }')
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
