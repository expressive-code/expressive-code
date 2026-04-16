import { describe, test, expect } from 'vitest'
import { markdownToHtml } from 'satteri'
import draculaRaw from 'shiki/themes/dracula.mjs'
import { ThemeRegistration } from 'shiki/types.mjs'
import { getCssVarName, StyleSettingPath, ExpressiveCodeTheme, SatteriExpressiveCodeOptions } from '../src'
import satteriExpressiveCode from '../src'

const dracula = draculaRaw as Required<ThemeRegistration>
const buildCssVarValuesRegex = (setting: StyleSettingPath) => new RegExp(`${getCssVarName(setting)}:(.*?)[;}]`, 'g')
const regexCodeBg = buildCssVarValuesRegex('codeBackground')
const regexCodeColor = buildCssVarValuesRegex('codeForeground')

async function processMarkdown(markdown: string, options?: SatteriExpressiveCodeOptions): Promise<string> {
	const plugin = await satteriExpressiveCode(options)
	const result = await markdownToHtml(markdown, { hastPlugins: [plugin] })
	return result
}

const sampleCodeMarkdown = `
# Sample code
\`\`\`js ins={2}
// test.js
const a = 1
\`\`\`
`

describe('Usage inside satteri', () => {
	test('Renders code blocks with Expressive Code', async () => {
		const html = await processMarkdown(sampleCodeMarkdown)
		expect(html).toContain('expressive-code')
		expect(html).toContain('<style>')
		expect(html).toContain('ec-line')
		expect(html).toContain('highlight')
		expect(html).toContain('ins')
		// Expect Shiki syntax highlighting colors
		expect(html).toMatch(/--0:#/)
	})
	test('Provides access to styleOverrides settings contributed by default plugins', async () => {
		await satteriExpressiveCode({
			styleOverrides: {
				frames: {
					editorBackground: 'blue',
				},
			},
		})
	})
	describe('Supported inputs of the `themes` option', () => {
		const draculaBg = dracula.colors?.['editor.background'].toLowerCase()
		const draculaFg = dracula.colors?.['editor.foreground'].toLowerCase()

		test('Bundled Shiki theme names', async () => {
			await runThemeTests({
				testCases: [
					{ themes: ['light-plus'], bgColor: ['#ffffff'], textColor: ['#000000'] },
					{ themes: ['material-theme'], bgColor: ['#263238'], textColor: ['#eeffff'] },
				],
			})
		})
		test('JSON themes imported from NPM packages', async () => {
			await runThemeTests({
				testCases: [
					{
						themes: [dracula],
						bgColor: [draculaBg],
						textColor: [draculaFg],
					},
				],
			})
		})
		test('ExpressiveCodeTheme instances', async () => {
			await runThemeTests({
				testCases: [
					{
						themes: [new ExpressiveCodeTheme(dracula)],
						bgColor: [draculaBg],
						textColor: [draculaFg],
					},
				],
			})
		})
		test('Multiple themes in an array', async () => {
			await runThemeTests({
				testCases: [
					{
						themes: ['light-plus', 'material-theme'],
						bgColor: ['#ffffff', '#263238'],
						textColor: ['#000000', '#eeffff'],
					},
				],
			})
		})
	})
	test('Adds script modules inside the Expressive Code wrapper', async () => {
		const html = await processMarkdown(sampleCodeMarkdown)
		expect(html).toContain('<script')
		// Scripts should be inside the expressive-code wrapper
		const wrapperIndex = html.indexOf('expressive-code')
		const scriptIndex = html.indexOf('<script')
		expect(wrapperIndex).toBeLessThan(scriptIndex)
	})
	test('Does not repeat styles on subsequent code blocks', async () => {
		const multiBlockMarkdown = `${sampleCodeMarkdown}\n\n${sampleCodeMarkdown}`
		const html = await processMarkdown(multiBlockMarkdown)
		const styleMatches = html.match(/<style>/g)
		expect(styleMatches).toHaveLength(1)
	})
	test('Does not repeat script modules on subsequent code blocks', async () => {
		const singleBlockHtml = await processMarkdown(sampleCodeMarkdown)
		const singleBlockScripts = (singleBlockHtml.match(/<script /g) ?? []).length

		const multiBlockMarkdown = `${sampleCodeMarkdown}\n\n${sampleCodeMarkdown}`
		const multiBlockHtml = await processMarkdown(multiBlockMarkdown)
		const multiBlockScripts = (multiBlockHtml.match(/<script /g) ?? []).length

		// Script count should be the same regardless of how many code blocks
		expect(multiBlockScripts).toBe(singleBlockScripts)
	})
	describe('Normalizes tabs in code', () => {
		const codeWithTabs = `\`\`\`js
function test() {
	try {
		console.log('It worked!')
	} catch (e) {
		console.log('How did this happen?')
	}
}
\`\`\``

		test('Replaces tabs with 2 spaces by default', async () => {
			const html = await processMarkdown(codeWithTabs)
			// 2 spaces for one tab level (default tabWidth=2)
			expect(html).toContain('  try')
			expect(html).toContain('    console.log')
			expect(html).not.toContain('\t')
		})
		test('Can be configured to use a different tab width', async () => {
			const html = await processMarkdown(codeWithTabs, { tabWidth: 4 })
			expect(html).toContain('    try')
			expect(html).toContain('        console.log')
		})
		test('Can be skipped by setting tabWidth to 0', async () => {
			const html = await processMarkdown(codeWithTabs, { tabWidth: 0 })
			expect(html).toContain('\ttry')
		})
	})
	test('Extracts language from code block', async () => {
		const markdown = '```typescript\nconst x: number = 1\n```'
		const html = await processMarkdown(markdown)
		// The rendered output should contain syntax-highlighted TypeScript
		expect(html).toContain('expressive-code')
		expect(html).toMatch(/--0:#/)
	})
	test('Extracts meta from code block', async () => {
		const markdown = '```js title="hello.js"\nconsole.log("hello")\n```'
		const html = await processMarkdown(markdown)
		expect(html).toContain('hello.js')
	})
	test('Passes through non-code elements unchanged', async () => {
		const markdown = '# Hello\n\nA paragraph with no code.'
		const html = await processMarkdown(markdown)
		expect(html).toContain('<h1>Hello</h1>')
		expect(html).toContain('A paragraph with no code.')
		expect(html).not.toContain('expressive-code')
	})
})

async function runThemeTests({
	testCases,
	config,
}: {
	testCases: {
		themes: SatteriExpressiveCodeOptions['themes']
		bgColor?: string[] | undefined
		textColor?: string[] | undefined
	}[]
	config?: SatteriExpressiveCodeOptions | undefined
}) {
	await Promise.all(
		testCases.map(async (testCase) => {
			const html = await processMarkdown(sampleCodeMarkdown, { themes: testCase.themes, ...config })
			let performedTests = 0
			const performRegexTest = (expected: string[] | undefined, regex: RegExp) => {
				if (!expected) return
				const actual = [...new Set([...html.matchAll(regex)].map((match) => match[1]))]
				expect(actual).toEqual(expected)
				performedTests++
			}
			performRegexTest(testCase.bgColor, regexCodeBg)
			performRegexTest(testCase.textColor, regexCodeColor)
			expect(performedTests).toBeGreaterThan(0)
		})
	)
}
