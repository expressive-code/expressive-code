import { describe, expect, test } from 'vitest'
import { sanitize } from 'hast-util-sanitize'
import { toHtml } from 'hast-util-to-html'
import githubDark from 'shiki/themes/github-dark.json'
import githubLight from 'shiki/themes/github-light.json'
import dracula from 'shiki/themes/dracula.json'
import solarizedLight from 'shiki/themes/solarized-light.json'
import { WrapperAnnotation, getHookTestResult, getMultiPluginTestResult, nonArrayValues, nonObjectValues } from './utils'
import { ExpressiveCodeEngine, ExpressiveCodeEngineConfig } from '../src/common/engine'
import { ExpressiveCodeBlock } from '../src/common/block'
import { StyleVariant } from '../src/common/style-variants'
import { findDeclsBySelectorAndProperty, findDeclsByStyleSetting, parseCss } from '../../../../internal/test-utils'
import { ExpressiveCodeTheme } from '../src/common/theme'
import { groupWrapperClassName } from '../src/internal/css'
import { codeLineClass } from '../src/common/style-settings'
import { escapeRegExp } from '../src/internal/escaping'

describe('ExpressiveCodeEngine', () => {
	describe('render()', () => {
		describe('Validates input', () => {
			test('Throws on invalid input', async () => {
				const invalidValues: unknown[] = [
					// Non-array values (including one empty object)
					...nonArrayValues,
					// Arrays containing non-object values
					...nonObjectValues.map((value) => [value]),
					// Data objects with missing properties
					{ code: 'test' },
					{ language: 'test' },
					{ meta: 'test' },
				]
				for (const invalidValue of invalidValues) {
					await expect(async () => {
						const engine = new ExpressiveCodeEngine({ plugins: [] })
						// @ts-expect-error Intentionally passing an invalid value
						await engine.render(invalidValue)
					}, `Did not throw on invalid input ${JSON.stringify(invalidValue)}`).rejects.toThrow()
				}
			})
			test('Accepts a single ExpressiveCodeBlock instance', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const codeBlock = new ExpressiveCodeBlock({ code: 'test', language: 'md', meta: '' })
				const result = await engine.render(codeBlock)
				expect(result.renderedGroupContents).toHaveLength(1)
				expect(result.renderedGroupContents[0].codeBlock, 'Expected the same block instance to be returned in group contents').toBe(codeBlock)
			})
			test('Accepts a single data object and creates an ExpressiveCodeBlock instance from it', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const result = await engine.render({ code: 'test', language: 'md', meta: '' })
				expect(result.renderedGroupContents).toHaveLength(1)
				const codeBlock = result.renderedGroupContents[0].codeBlock
				expect(codeBlock).toBeInstanceOf(ExpressiveCodeBlock)
				expect(codeBlock.code).toEqual('test')
			})
			test('Accepts multiple ExpressiveCodeBlock instances', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const codeBlocks = ['test1', 'test2', 'test3'].map((code) => new ExpressiveCodeBlock({ code, language: 'md', meta: '' }))
				const result = await engine.render(codeBlocks)
				expect(result.renderedGroupContents).toHaveLength(codeBlocks.length)
				codeBlocks.forEach((codeBlock, i) => {
					expect(result.renderedGroupContents[i].codeBlock, 'Expected the same block instances to be returned in group contents').toBe(codeBlock)
				})
			})
			test('Accepts multiple data objects and creates ExpressiveCodeBlock instances from them', async () => {
				const engine = new ExpressiveCodeEngine({ plugins: [] })
				const dataObjects = ['test1', 'test2', 'test3'].map((code) => ({ code, language: 'md', meta: '' }))
				const result = await engine.render(dataObjects)
				expect(result.renderedGroupContents).toHaveLength(dataObjects.length)
				dataObjects.forEach((dataObject, i) => {
					expect(result.renderedGroupContents[i].codeBlock.code, 'Expected the created block instance to contain the input code').toEqual(dataObject.code)
				})
			})
		})
		describe('Returns the rendered code block AST', () => {
			test('Plain code block', async () => {
				const { renderedBlockAst } = await getMultiPluginTestResult({ plugins: [] })
				const html = toHtml(sanitize(renderedBlockAst, {}))
				expect(html).toMatch(new RegExp('<pre(|\\s[^>]+)><code><div>Example code...</div><div>...with two lines!</div></code></pre>'))
			})
			test('Code block with inline annotation', async () => {
				const searchTerm = 'two '
				const { renderedBlockAst } = await getHookTestResult('annotateCode', ({ codeBlock }) => {
					const line = codeBlock.getLine(1)
					if (!line) return
					const index = line.text.indexOf(searchTerm)
					line.addAnnotation(
						new WrapperAnnotation({
							selector: 'del',
							inlineRange: {
								columnStart: index,
								columnEnd: index + searchTerm.length,
							},
						})
					)
				})
				const html = toHtml(sanitize(renderedBlockAst, {}))
				expect(html).toMatch(new RegExp('<pre(|\\s[^>]+)><code><div>Example code...</div><div>...with <del>two </del>lines!</div></code></pre>'))
			})
		})
		describe('Allows plugin hooks to access theme colors', () => {
			test('Default themes (github-dark, github-light)', async () => {
				let extractedStyleVariants: StyleVariant[] = []
				await getHookTestResult('annotateCode', ({ styleVariants }) => {
					extractedStyleVariants = styleVariants
				})
				expect(extractedStyleVariants).toHaveLength(2)
				const extractedDark = extractedStyleVariants[0].theme
				const extractedLight = extractedStyleVariants[1].theme
				if (!extractedDark) throw new Error('Expected dark theme to be defined')
				if (!extractedLight) throw new Error('Expected light theme to be defined')

				expect(extractedDark.name).toEqual('github-dark')
				expect(extractedDark.colors['editor.foreground']).toEqual(githubDark.colors['editor.foreground'].toLowerCase())
				expect(extractedDark.colors['editor.background']).toEqual(githubDark.colors['editor.background'].toLowerCase())
				expect(extractedLight.name).toEqual('github-light')
				expect(extractedLight.colors['editor.foreground']).toEqual(githubLight.colors['editor.foreground'].toLowerCase())
				expect(extractedLight.colors['editor.background']).toEqual(githubLight.colors['editor.background'].toLowerCase())
			})
		})
	})
	describe('getBaseStyles()', () => {
		test('Selection styles are disabled by default', async () => {
			const engine = new ExpressiveCodeEngine({})
			expect(await engine.getBaseStyles()).not.toMatch(/::selection/)
		})
		test('Selection styles can be enabled by setting `useThemedSelectionColors` to true', async () => {
			const engine = new ExpressiveCodeEngine({ useThemedSelectionColors: true })
			expect(await engine.getBaseStyles()).toMatch(/::selection/)
		})
		test('Scrollbar styles are enabled by default', async () => {
			const engine = new ExpressiveCodeEngine({})
			expect(await engine.getBaseStyles()).toMatch(/::-webkit-scrollbar/)
		})
		test('Scrollbar styles can be disabled by setting `useThemedScrollbars` to false', async () => {
			const engine = new ExpressiveCodeEngine({ useThemedScrollbars: false })
			expect(await engine.getBaseStyles()).not.toMatch(/::-webkit-scrollbar/)
		})
		test('Base styles do not contain unexpected newlines', async () => {
			const engine = new ExpressiveCodeEngine({})
			const styles = await engine.getBaseStyles()
			expect(styles, `Found unexpected newlines: ${styles}`).not.toContain('\n')
		})
	})
	describe('getThemeStyles()', () => {
		const inlineStyleSelector = `.${codeLineClass} span[style^='--']:not([class])`

		test('Contains CSS variables for `github-dark` and `github-light` by default', async () => {
			const engine = new ExpressiveCodeEngine({})
			const styles = await engine.getThemeStyles()
			const parsedStyles = parseCss(styles)
			expect(findDeclsByStyleSetting(parsedStyles, 'codeForeground')).toMatchObject([
				{
					value: githubDark.colors['editor.foreground'],
					nestedSelectors: [':root'],
				},
				{
					value: githubLight.colors['editor.foreground'],
					nestedSelectors: ['@media (prefers-color-scheme: light)', `:root:not([data-theme='github-dark'])`],
				},
				{
					value: githubLight.colors['editor.foreground'],
					nestedSelectors: [expect.stringContaining('github-light') as boolean],
				},
			])
			expect(findDeclsByStyleSetting(parsedStyles, 'codeBackground')).toMatchObject([
				{
					value: githubDark.colors['editor.background'],
					nestedSelectors: [':root'],
				},
				{
					value: githubLight.colors['editor.background'],
					nestedSelectors: ['@media (prefers-color-scheme: light)', `:root:not([data-theme='github-dark'])`],
				},
				{
					value: githubLight.colors['editor.background'],
					nestedSelectors: [expect.stringContaining('github-light') as boolean],
				},
			])
		})
		test('Contains properly scoped core theme styles for inline annotations', async () => {
			const engine = new ExpressiveCodeEngine({})
			const styles = await engine.getThemeStyles()
			const parsedStyles = parseCss(styles)
			const inlineDecls = findDeclsBySelectorAndProperty(parsedStyles, new RegExp(`${escapeRegExp(inlineStyleSelector)}$`), 'color')
			expect(inlineDecls).toMatchObject([
				{
					value: 'var(--0, inherit)',
					nestedSelectors: [`.${groupWrapperClassName} ${inlineStyleSelector}`],
				},
				{
					value: 'var(--1, inherit)',
					nestedSelectors: ['@media (prefers-color-scheme: light)', `:root:not([data-theme='github-dark']) .${groupWrapperClassName} ${inlineStyleSelector}`],
				},
				{
					value: 'var(--1, inherit)',
					nestedSelectors: [
						`:root[data-theme='github-light'] .${groupWrapperClassName} ${inlineStyleSelector},.${groupWrapperClassName}[data-theme='github-light'] ${inlineStyleSelector}`,
					],
				},
			])
		})
		describe('Supports generating CSS rules to select a theme', () => {
			test('Adds theme selectors for the document and groups using the `data-theme` attribute by default', async () => {
				const engine = new ExpressiveCodeEngine({})
				const styles = await engine.getThemeStyles()
				const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
				expect(backgroundDecls).toContainEqual(
					expect.objectContaining({
						value: githubLight.colors['editor.background'],
						selector: `:root[data-theme='github-light'] .${groupWrapperClassName},.${groupWrapperClassName}[data-theme='github-light']`,
					})
				)
			})
			describe('Allows customizing the root selector by setting `themeCssRoot`', () => {
				test('Uses `themeCssRoot` when scoping CSS variables', async () => {
					const engine = new ExpressiveCodeEngine({
						themeCssRoot: 'body',
					})
					const styles = await engine.getThemeStyles()
					const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
					expect(backgroundDecls).toContainEqual(
						expect.objectContaining({
							value: githubLight.colors['editor.background'],
							selector: `body[data-theme='github-light'] .${groupWrapperClassName},.${groupWrapperClassName}[data-theme='github-light']`,
						})
					)
				})
				test('Uses `themeCssRoot` when scoping core theme styles for inline annotations', async () => {
					const engine = new ExpressiveCodeEngine({
						themeCssRoot: 'body',
					})
					const styles = await engine.getThemeStyles()
					const parsedStyles = parseCss(styles)
					const inlineDecls = findDeclsBySelectorAndProperty(parsedStyles, new RegExp(`${escapeRegExp(inlineStyleSelector)}$`), 'color')
					expect(inlineDecls).toMatchObject([
						{
							value: 'var(--0, inherit)',
							nestedSelectors: [`.${groupWrapperClassName} ${inlineStyleSelector}`],
						},
						{
							value: 'var(--1, inherit)',
							nestedSelectors: ['@media (prefers-color-scheme: light)', `body:not([data-theme='github-dark']) .${groupWrapperClassName} ${inlineStyleSelector}`],
						},
						{
							value: 'var(--1, inherit)',
							nestedSelectors: [
								`body[data-theme='github-light'] .${groupWrapperClassName} ${inlineStyleSelector},.${groupWrapperClassName}[data-theme='github-light'] ${inlineStyleSelector}`,
							],
						},
					])
				})
			})
			describe('Allows customizing theme selectors by setting `themeCssSelector` to a function', () => {
				test('Uses `themeCssSelector` when scoping CSS variables', async () => {
					const engine = new ExpressiveCodeEngine({
						themeCssSelector: (theme) => `.theme-${theme.name}`,
					})
					const styles = await engine.getThemeStyles()
					const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
					expect(backgroundDecls).toContainEqual(
						expect.objectContaining({
							value: githubLight.colors['editor.background'],
							selector: `:root.theme-github-light .${groupWrapperClassName},.${groupWrapperClassName}.theme-github-light`,
						})
					)
				})
				test('Uses `themeCssSelector` when scoping core theme styles for inline annotations', async () => {
					const engine = new ExpressiveCodeEngine({
						themeCssSelector: (theme) => `.theme-${theme.name}`,
					})
					const styles = await engine.getThemeStyles()
					const parsedStyles = parseCss(styles)
					const inlineDecls = findDeclsBySelectorAndProperty(parsedStyles, new RegExp(`${escapeRegExp(inlineStyleSelector)}$`), 'color')
					expect(inlineDecls).toMatchObject([
						{
							value: 'var(--0, inherit)',
							nestedSelectors: [`.${groupWrapperClassName} ${inlineStyleSelector}`],
						},
						{
							value: 'var(--1, inherit)',
							nestedSelectors: ['@media (prefers-color-scheme: light)', `:root:not(.theme-github-dark) .${groupWrapperClassName} ${inlineStyleSelector}`],
						},
						{
							value: 'var(--1, inherit)',
							nestedSelectors: [`:root.theme-github-light .${groupWrapperClassName} ${inlineStyleSelector},.${groupWrapperClassName}.theme-github-light ${inlineStyleSelector}`],
						},
					])
				})
			})
			test('Allows disabling theme selectors by setting `themeCssSelector` to `false`', async () => {
				const engine = new ExpressiveCodeEngine({
					themeCssSelector: false,
				})
				const styles = await engine.getThemeStyles()
				const parsedStyles = parseCss(styles)
				expect(findDeclsByStyleSetting(parsedStyles, 'codeForeground')).toMatchObject([
					{
						value: githubDark.colors['editor.foreground'],
						nestedSelectors: [':root'],
					},
					// Still expect the media query for light mode, but without a negated
					// base theme selector
					{
						value: githubLight.colors['editor.foreground'],
						nestedSelectors: ['@media (prefers-color-scheme: light)', ':root'],
					},
					// Do not expect the theme selector
				])
				expect(findDeclsByStyleSetting(parsedStyles, 'codeBackground')).toMatchObject([
					{
						value: githubDark.colors['editor.background'],
						nestedSelectors: [':root'],
					},
					// Still expect the media query for light mode, but without a negated
					// base theme selector
					{
						value: githubLight.colors['editor.background'],
						nestedSelectors: ['@media (prefers-color-scheme: light)', ':root'],
					},
					// Do not expect the theme selector
				])
			})
		})
		describe('Supports generating a dark mode media query', () => {
			test('Media query is present by default', async () => {
				const engine = new ExpressiveCodeEngine({})
				const styles = await engine.getThemeStyles()
				const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
				// Expect a declaration for the base dark theme (on the `:root` selector)
				expect(backgroundDecls).toContainEqual(
					expect.objectContaining({
						value: githubDark.colors['editor.background'],
						nestedSelectors: [':root'],
					})
				)
				// Expect a declaration for the light theme by media query
				expect(backgroundDecls).toContainEqual(
					expect.objectContaining({
						value: githubLight.colors['editor.background'],
						nestedSelectors: ['@media (prefers-color-scheme: light)', `:root:not([data-theme='github-dark'])`],
					})
				)
			})
			test('Media query respects the value of `themeCssRoot`', async () => {
				const engine = new ExpressiveCodeEngine({
					themeCssRoot: 'body',
				})
				const styles = await engine.getThemeStyles()
				const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
				// Expect a declaration for the base dark theme (on the `body` selector)
				expect(backgroundDecls).toContainEqual(
					expect.objectContaining({
						value: githubDark.colors['editor.background'],
						nestedSelectors: ['body'],
					})
				)
				// Expect a declaration for the light theme by media query
				expect(backgroundDecls).toContainEqual(
					expect.objectContaining({
						value: githubLight.colors['editor.background'],
						nestedSelectors: ['@media (prefers-color-scheme: light)', `body:not([data-theme='github-dark'])`],
					})
				)
			})
			test('Media query is present by default when `themes` is set to one light and one dark theme', async () => {
				const engine = new ExpressiveCodeEngine({
					themes: [
						// Test a different order than the default:
						// Use a light theme as the base theme, and a dark theme as the alternative
						new ExpressiveCodeTheme(githubLight),
						new ExpressiveCodeTheme(githubDark),
					],
				})
				const styles = await engine.getThemeStyles()
				const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
				// Expect a declaration for the base light theme (on the `:root` selector)
				expect(backgroundDecls).toContainEqual(
					expect.objectContaining({
						value: githubLight.colors['editor.background'],
						nestedSelectors: [':root'],
					})
				)
				// Expect a declaration for the dark theme by media query
				expect(backgroundDecls).toContainEqual(
					expect.objectContaining({
						value: githubDark.colors['editor.background'],
						nestedSelectors: ['@media (prefers-color-scheme: dark)', `:root:not([data-theme='github-light'])`],
					})
				)
			})
			describe('Media query is not present by default when `themes` is not set to one light and one dark theme', () => {
				test('Dark theme only', async () => {
					await expectNoMediaQueryForConfig({
						themes: [new ExpressiveCodeTheme(githubDark)],
					})
				})
				test('Multiple dark themes', async () => {
					await expectNoMediaQueryForConfig({
						themes: [new ExpressiveCodeTheme(githubDark), new ExpressiveCodeTheme(dracula)],
					})
				})
				test('Light theme only', async () => {
					await expectNoMediaQueryForConfig({
						themes: [new ExpressiveCodeTheme(githubLight)],
					})
				})
				test('Multiple light themes', async () => {
					await expectNoMediaQueryForConfig({
						themes: [new ExpressiveCodeTheme(githubLight), new ExpressiveCodeTheme(solarizedLight)],
					})
				})
				test('More than two themes', async () => {
					await expectNoMediaQueryForConfig({
						themes: [new ExpressiveCodeTheme(githubDark), new ExpressiveCodeTheme(dracula), new ExpressiveCodeTheme(githubLight)],
					})
				})
			})
			test('Media query can be disabled by setting `useDarkModeMediaQuery` to false', async () => {
				await expectNoMediaQueryForConfig({
					useDarkModeMediaQuery: false,
				})
			})
			describe('Media query can be enforced by setting `useDarkModeMediaQuery` to true', () => {
				test('First theme of opposite type is used in media query', async () => {
					const engine = new ExpressiveCodeEngine({
						themes: [
							// Base theme type: dark
							new ExpressiveCodeTheme(githubDark),
							// Another dark theme
							new ExpressiveCodeTheme(dracula),
							// First theme of opposite type (light)
							new ExpressiveCodeTheme(githubLight),
						],
						useDarkModeMediaQuery: true,
					})
					const styles = await engine.getThemeStyles()
					const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
					// Expect a declaration for the base dark theme (on the `:root` selector)
					expect(backgroundDecls).toContainEqual(
						expect.objectContaining({
							value: githubDark.colors['editor.background'],
							nestedSelectors: [':root'],
						})
					)
					// Expect a declaration for the first theme of opposite type by media query
					expect(backgroundDecls).toContainEqual(
						expect.objectContaining({
							value: githubLight.colors['editor.background'],
							nestedSelectors: ['@media (prefers-color-scheme: light)', `:root:not([data-theme='github-dark'])`],
						})
					)
				})
				test('Throws if `themes` does not contain at least one light and one dark theme', async () => {
					const engine = new ExpressiveCodeEngine({
						themes: [new ExpressiveCodeTheme(githubDark)],
						useDarkModeMediaQuery: true,
					})
					await expect(async () => {
						return await engine.getThemeStyles()
					}).rejects.toThrow()
				})
			})
		})
		test('Theme styles do not contain unexpected newlines', async () => {
			const engine = new ExpressiveCodeEngine({})
			const styles = await engine.getThemeStyles()
			expect(styles, `Found unexpected newlines: ${styles}`).not.toContain('\n')
		})
	})
	describe('getJsModules()', () => {
		test('Returns an empty array if no modules are provided', async () => {
			const engine = new ExpressiveCodeEngine({
				plugins: [
					{
						name: 'TestPlugin',
						hooks: {},
					},
				],
			})
			expect(await engine.getJsModules()).toEqual([])
		})
		describe('Returns the JS modules provided by a plugin', () => {
			test('Supports empty arrays', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: [],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual([])
			})
			test('Supports string arrays', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: ['console.log("Test 1")', 'console.log("Test 2")'],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['console.log("Test 1")', 'console.log("Test 2")'])
			})
			test('Supports module resolver functions', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: ({ styleVariants }) => [`console.log("${styleVariants.length}: ${styleVariants.map((variant) => variant.theme.name).join(', ')}")`],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['console.log("2: github-dark, github-light")'])
			})
		})
		describe('Deduplicates JS modules', () => {
			test('When they contain the same code', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: () => ['export const test = "something"', 'export const test = "something"'],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['export const test = "something"'])
			})
			test('When they only differ in surrounding whitespace', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin',
							hooks: {},
							jsModules: () => ['export const test = "something"', '\t\texport const test = "something" '],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['export const test = "something"'])
			})
			test('Also checks across plugins', async () => {
				const engine = new ExpressiveCodeEngine({
					plugins: [
						{
							name: 'TestPlugin1',
							hooks: {},
							jsModules: () => ['export const test = "something"', 'console.log(test)'],
						},
						{
							name: 'TestPlugin2',
							hooks: {},
							jsModules: () => ['console.log("Success!")', '\texport const test = "something"'],
						},
					],
				})
				expect(await engine.getJsModules()).toEqual(['export const test = "something"', 'console.log(test)', 'console.log("Success!")'])
			})
		})
	})
})

async function expectNoMediaQueryForConfig(config: ExpressiveCodeEngineConfig) {
	const engine = new ExpressiveCodeEngine(config)
	const styles = await engine.getThemeStyles()
	const backgroundDecls = findDeclsByStyleSetting(parseCss(styles), 'codeBackground')
	// Expect no media query
	expect(backgroundDecls).not.toContainEqual(
		expect.objectContaining({
			selector: expect.stringContaining('prefers-color-scheme') as boolean,
		})
	)
}
