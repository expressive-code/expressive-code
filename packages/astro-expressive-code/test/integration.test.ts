import { describe, test, expect, beforeAll } from 'vitest'
import { existsSync, rmSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import type { AstroUserConfig } from 'astro/config'
import { getInlineStyles, toText, selectAll } from 'remark-expressive-code/hast'
import { fromHtml } from '@internal/test-utils'
import { buildSampleCodeHtmlRegExp } from '../../remark-expressive-code/test/utils'
import { getAssetsBaseHref } from '../src/astro-config'

const skipAstro3Tests = !!process.env.npm_config_ecosystem_ci

const complexHtmlRegExp = buildSampleCodeHtmlRegExp({
	title: 'src/layouts/BaseLayout.astro',
	codeContents: [
		// Expect the code to start with a collapsible section
		'<details(| .*?)>.*?</details>',
		'.*?',
		// Expect a second collapsible section
		'<details(| .*?)>.*?</details>',
		'.*?',
		// Expect at least one code line that is marked as inserted
		'<div class="ec-line highlight ins">',
		// Expect Shiki highlighting colors inside
		'.*?--0:#.*?',
		// Expect all elements to be closed
		'</div>',
		'.*?',
	],
})

const multiCodeComponentHtmlRegExp = buildSampleCodeHtmlRegExp({
	title: '',
	codeContents: [
		'.*?',
		// Expect at least one code line that is marked
		'<div class="ec-line highlight mark">',
		// Expect Shiki highlighting colors inside
		'.*?--0:#.*?',
		// Expect the text "code block #" followed by the number 1-3 inside
		'.*?code block #[1-3].*?',
		// Expect all elements to be closed
		'</div>',
		'.*?',
	],
})

describe.skipIf(skipAstro3Tests)('Integration into Astro 3.3.0', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-3.3.0',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Renders code blocks in Markdown files', () => {
		const html = fixture?.readFile('index.html') ?? ''
		validateHtml(html)
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html)
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.css$/))).toHaveLength(1)
	})

	test('Emits an external script into the Astro assets dir', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.js$/))).toHaveLength(1)
	})
})

describe.skipIf(skipAstro3Tests)('Integration into Astro ^3.5.0 with `emitExternalStylesheet: false`', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-3.5.0-no-external-css',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Renders code blocks in Markdown files', () => {
		const html = fixture?.readFile('index.html') ?? ''
		validateHtml(html, { emitExternalStylesheet: false })
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, { emitExternalStylesheet: false })
	})

	test('Emits no external stylesheet due to `emitExternalStylesheet: false`', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.css$/))).toHaveLength(0)
	})

	test('Emits an external script into the Astro assets dir', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.js$/))).toHaveLength(1)
	})
})

describe.skipIf(skipAstro3Tests)('Integration into Astro ^3.5.0 using custom `base` and `build.assets` paths', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	// Provide a copy of the settings defined in `astro.config.mjs` to the tests
	const astroConfig = { base: '/subpath', build: { assets: '_custom' } }

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-3.5.0-custom-paths',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Renders code blocks in Markdown files', () => {
		const html = fixture?.readFile('index.html') ?? ''
		validateHtml(html, { astroConfig })
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, { astroConfig })
	})

	test('Renders <Code> components in MDX files', () => {
		const html = fixture?.readFile('mdx-code-component/index.html') ?? ''
		validateHtml(html, { astroConfig })
		expect(html).toContain('Code component in MDX files')
	})

	test('When rendering multiple <Code> components on a page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('mdx-many-code-components/index.html') ?? ''
		validateHtml(html, {
			astroConfig,
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
		})
		expect(html).toContain('Many code components in an MDX file')
		const stylesAndScriptsPerBlock = [...html.matchAll(/<div class="expressive-code(| .*?)">(.*?)<figure/g)].map((match) => match[2])
		expect(stylesAndScriptsPerBlock).toHaveLength(3)
		expect(stylesAndScriptsPerBlock[0]).toContain(`/${astroConfig.build.assets}/ec.`)
		expect(stylesAndScriptsPerBlock.slice(-2)).toEqual(['', ''])
	})

	test('Renders <Code> components in Astro files', () => {
		const html = fixture?.readFile('astro-code-component/index.html') ?? ''
		validateHtml(html, { astroConfig })
		expect(html).toContain('Code component in Astro files')
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		const files = fixture?.readDir(astroConfig.build.assets) ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.css$/))).toHaveLength(1)
		expect(
			files.filter((fileName) => fileName.match(/^logo\./)),
			'Expected Astro to use the same directory for image assets'
		).toHaveLength(1)
	})

	test('Emits an external script into the Astro assets dir', () => {
		const files = fixture?.readDir(astroConfig.build.assets) ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.js$/))).toHaveLength(1)
		expect(
			files.filter((fileName) => fileName.match(/^logo\./)),
			'Expected Astro to use the same directory for image assets'
		).toHaveLength(1)
	})
})

describe('Integration into Astro ^4.0.0', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-4.0.0',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Renders code blocks in Markdown files', () => {
		const html = fixture?.readFile('index.html') ?? ''
		validateHtml(html)
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html)
	})

	test('Renders <Code> components in MDX files', () => {
		const html = fixture?.readFile('mdx-code-component/index.html') ?? ''
		validateHtml(html)
		expect(html).toContain('Code component in MDX files')
	})

	test('When rendering multiple <Code> components on a page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('mdx-many-code-components/index.html') ?? ''
		validateHtml(html, {
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
		})
		expect(html).toContain('Many code components in an MDX file')
		const stylesAndScriptsPerBlock = [...html.matchAll(/<div class="expressive-code(| .*?)">(.*?)<figure/g)].map((match) => match[2])
		expect(stylesAndScriptsPerBlock).toHaveLength(3)
		expect(stylesAndScriptsPerBlock[0]).toContain('/_astro/ec.')
		expect(stylesAndScriptsPerBlock.slice(-2)).toEqual(['', ''])
	})

	test('Renders <Code> components in Astro files', () => {
		const html = fixture?.readFile('astro-code-component/index.html') ?? ''
		validateHtml(html)
		expect(html).toContain('Code component in Astro files')
	})

	test('Supports custom languages', () => {
		const html = fixture?.readFile('custom-language/index.html') ?? ''
		expect(html).toContain('Custom language')
		const hast = fromHtml(html, { fragment: true })
		const codeBlocks = selectAll('.expressive-code', hast)
		expect(codeBlocks).toHaveLength(3)
		const tokensPerCodeBlock = codeBlocks.map((codeBlock) => {
			const tokens = selectAll('.ec-line span[style^="--0"]', codeBlock)
			return tokens.map((token) => {
				return {
					text: toText(token),
					color: getInlineStyles(token).get('--0'),
				}
			})
		})
		const [mdWithNestedLangs, customLang, jsLang] = tokensPerCodeBlock
		const customLangTokenColors = [
			{ text: 'test', color: '#F699D9' },
			{ text: 'my', color: '#AEE9F5' },
			{ text: '"lang"', color: '#A3B5C3' },
		]
		const jsLangTokenColors = [
			{ text: 'import', color: '#EBEA8B' },
			{ text: 'something', color: '#AEE9F5' },
		]
		expect(mdWithNestedLangs, 'Failed to highlight custom language nested in markdown code block').toEqual(expect.arrayContaining(customLangTokenColors))
		expect(mdWithNestedLangs, 'Failed to highlight JS language nested in markdown code block after adding custom language').toEqual(expect.arrayContaining(jsLangTokenColors))
		expect(customLang, 'Failed to highlight fenced code block using custom language').toEqual(expect.arrayContaining(customLangTokenColors))
		expect(jsLang, 'Failed to highlight fenced code block using JS language after adding custom language').toEqual(expect.arrayContaining(jsLangTokenColors))
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.css$/))).toHaveLength(1)
	})

	test('Emits an external script into the Astro assets dir', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.js$/))).toHaveLength(1)
	})
})

describe('Integration into Astro ^4.5.0 with Cloudflare adapter', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-4.5.0',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Emits an external stylesheet into the Astro assets dir', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.css$/))).toHaveLength(1)
	})

	test('Emits an external script into the Astro assets dir', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.js$/))).toHaveLength(1)
	})
})

function validateHtml(
	html: string,
	options?: {
		emitExternalStylesheet?: boolean | undefined
		astroConfig?: AstroUserConfig | undefined
		expectedHtmlRegExp?: RegExp | undefined
		expectedCodeBlockCount?: number | undefined
	}
) {
	const { emitExternalStylesheet = true, astroConfig, expectedHtmlRegExp = complexHtmlRegExp, expectedCodeBlockCount = 1 } = options ?? {}

	const assetsDir = astroConfig?.build?.assets || '_astro'

	// Expect the HTML structure to match our regular expression
	const matches = html.match(expectedHtmlRegExp)
	expect(matches).toBeTruthy()

	// Depending on the `emitExternalStylesheet` option, expect the `styles` capture group
	// to either contain an external stylesheet or an inline style element
	const styles = matches?.groups?.['styles']
	if (emitExternalStylesheet) {
		const styleBaseHref = `${getAssetsBaseHref('.css', astroConfig?.build?.assetsPrefix, astroConfig?.base)}/${assetsDir}/`.replace(/\/+/g, '/')
		expect(styles, `Expected a stylesheet link href beginning with "${styleBaseHref}", but got "${styles}"`).toMatch(
			new RegExp(`<link rel="stylesheet" href="${styleBaseHref}ec\\..*?\\.css"\\s*/?>`)
		)
	} else {
		expect(styles).toContain('<style>')
	}

	// Expect the `scripts` capture group to contain an external script module
	const scripts = matches?.groups?.['scripts']
	const scriptBaseHref = `${getAssetsBaseHref('.js', astroConfig?.build?.assetsPrefix, astroConfig?.base)}/${assetsDir}/`.replace(/\/+/g, '/')
	expect(scripts, `Expected a script module src beginning with "${scriptBaseHref}", but got "${scripts}"`).toMatch(
		new RegExp(`<script type="module" src="${scriptBaseHref}ec\\..*?\\.js"\\s*/?>`)
	)

	// Collect all code blocks
	const codeBlockClassNames = [...html.matchAll(/<div class="(expressive-code(?:| .*?))">/g)].map((match) => match[1])
	// Check the number of code blocks
	expect(codeBlockClassNames).toHaveLength(expectedCodeBlockCount)
	// TODO: Validate that CSS variables were generated for the configured themes
	// TODO: Validate automatic theme selection based on the user's system preferences
	// TODO: Maybe add a second set of pages including two code blocks to test that the styles are deduplicated
}

async function buildFixture({ fixtureDir, buildCommand, buildArgs, outputDir }: { fixtureDir: string; buildCommand: string; buildArgs?: string[] | undefined; outputDir: string }) {
	const fixturePath = join(__dirname, 'fixtures', fixtureDir)
	const outputDirPath = join(fixturePath, outputDir)

	// Remove the output directory if it exists
	if (existsSync(outputDirPath)) {
		rmSync(outputDirPath, { recursive: true })
	}

	// Run the build command
	const buildCommandResult = await execa(buildCommand, buildArgs ?? [], { cwd: fixturePath })

	// Throw an error if the build command failed
	if (buildCommandResult.failed || buildCommandResult.stderr) {
		throw new Error(buildCommandResult.stderr.toString())
	}

	// Return an object that contains the output directory path and allows to read files from it
	return {
		path: outputDirPath,
		readFile: (filePath: string) => readFileSync(join(outputDirPath, filePath), 'utf-8'),
		readDir: (subPath: string) => readdirSync(join(outputDirPath, subPath), 'utf-8'),
	}
}
