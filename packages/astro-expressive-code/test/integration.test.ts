import { describe, test, expect, beforeAll } from 'vitest'
import { existsSync, rmSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import type { AstroUserConfig } from 'astro/config'
import { getInlineStyles, toText, selectAll } from 'rehype-expressive-code/hast'
import { fromHtml, buildSampleCodeHtmlRegExp, escapeRegExp, extractTopLevelAssetsFromBlock, extractCodeBlocks } from '@internal/test-utils'
import { getAssetsBaseHref } from '../src/astro-config'

const isEcosystemCiRun = !!process.env.npm_config_ecosystem_ci

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
		// Expect the text "code block #" followed by the number 1-3
		'.*?code block #[1-3].*?',
		// Expect at least one code line that is marked
		'<div class="ec-line highlight mark">',
		// Expect Shiki highlighting colors inside
		'.*?--0:#.*?',
		// Expect all elements to be closed
		'</div>',
		'.*?',
	],
})

describe.skipIf(isEcosystemCiRun)('Integration into Astro 3.3.0', () => {
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
		validateHtml(html, fixture)
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, fixture)
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'css')
	})

	test('Emits an external script into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'js')
	})
})

describe.skipIf(isEcosystemCiRun)('Integration into Astro ^3.5.0 with `emitExternalStylesheet: false`', () => {
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
		validateHtml(html, fixture, { emitExternalStylesheet: false })
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, fixture, {
			emitExternalStylesheet: false,
			expectedElementsBeforeCode: [
				// Expect the first block to contain a style element with the base styles, a JS link,
				// and due to the meta attribute "addStyles" triggering our custom addStylesPlugin,
				// also expect an inline style element adding our test style
				[expectStyleElement(), expectStyleElement('orange !important'), expectScriptLink()],
			],
		})
	})

	test('When rendering multiple <Code> components on an Astro page, adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('astro-many-code-components/index.html') ?? ''
		validateHtml(html, fixture, {
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			emitExternalStylesheet: false,
			expectedCodeBlockCount: 3,
			expectedElementsBeforeCode: [
				// Expect the first block to contain a style element with the base styles, a JS link,
				// and due to the meta attribute "addStyles" triggering our custom addStylesPlugin,
				// also expect an inline style element adding our test style
				[expectStyleElement(), expectStyleElement('orange !important'), expectScriptLink()],
				[],
				[],
			],
		})
		expect(html).toContain('Code components in Astro files')
	})

	test('Emits no external stylesheet due to `emitExternalStylesheet: false`', () => {
		const files = fixture?.readDir('_astro') ?? []
		expect(files.filter((fileName) => fileName.match(/^ec\..*?\.css$/))).toHaveLength(0)
	})

	test('Emits an external script into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'js')
	})
})

describe.skipIf(isEcosystemCiRun)('Integration into Astro ^3.5.0 using custom `base` and `build.assets` paths', () => {
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
		validateHtml(html, fixture, { astroConfig })
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, fixture, { astroConfig })
	})

	test('Renders <Code> components in MDX files', () => {
		const html = fixture?.readFile('mdx-code-component/index.html') ?? ''
		validateHtml(html, fixture, { astroConfig })
		expect(html).toContain('Code component in MDX files')
	})

	test('When rendering multiple <Code> components on a page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('mdx-many-code-components/index.html') ?? ''
		validateHtml(html, fixture, {
			astroConfig,
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
		})
		expect(html).toContain('Many code components in an MDX file')
	})

	test('Renders <Code> components in Astro files', () => {
		const html = fixture?.readFile('astro-code-component/index.html') ?? ''
		validateHtml(html, fixture, { astroConfig })
		expect(html).toContain('Code component in Astro files')
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'css', astroConfig.build.assets)
		const files = fixture?.readDir(astroConfig.build.assets) ?? []
		expect(
			files.filter((fileName) => fileName.match(/^logo\./)),
			'Expected Astro to use the same directory for image assets'
		).toHaveLength(1)
	})

	test('Emits an external script into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'js', astroConfig.build.assets)
		const files = fixture?.readDir(astroConfig.build.assets) ?? []
		expect(
			files.filter((fileName) => fileName.match(/^logo\./)),
			'Expected Astro to use the same directory for image assets'
		).toHaveLength(1)
	})
})

describe.skipIf(isEcosystemCiRun)('Integration into Astro ^4.0.0', () => {
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
		validateHtml(html, fixture)
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, fixture)
	})

	test('Renders <Code> components in MDX files', () => {
		const html = fixture?.readFile('mdx-code-component/index.html') ?? ''
		validateHtml(html, fixture)
		expect(html).toContain('Code component in MDX files')
	})

	test('When rendering multiple <Code> components on a page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('mdx-many-code-components/index.html') ?? ''
		validateHtml(html, fixture, {
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
		})
		expect(html).toContain('Many code components in an MDX file')
	})

	test('Renders <Code> components in Astro files', () => {
		const html = fixture?.readFile('astro-code-component/index.html') ?? ''
		validateHtml(html, fixture)
		expect(html).toContain('Code component in Astro files')
	})

	describe('Supports custom languages', () => {
		test('Highlights custom language nested in markdown code block', () => {
			const { mdWithNestedLangs, customLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(mdWithNestedLangs).toEqual(expect.arrayContaining(customLangTokenColors))
		})
		test('Highlights JS language nested in markdown code block after adding custom language', () => {
			const { mdWithNestedLangs, jsLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(mdWithNestedLangs).toEqual(expect.arrayContaining(jsLangTokenColors))
		})
		test('Highlights fenced code block using custom language', () => {
			const { customLang, customLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(customLang).toEqual(expect.arrayContaining(customLangTokenColors))
		})
		test('Highlights fenced code block using JS language after adding custom language', () => {
			const { jsLang, jsLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(jsLang).toEqual(expect.arrayContaining(jsLangTokenColors))
		})
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'css')
	})

	test('Emits an external script into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'js')
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

	test('Removes unused Shiki language chunks based on `bundledLangs` option', () => {
		const files = fixture?.readDir('_worker.js/chunks') ?? []
		expect(
			files.filter((fileName) => fileName.match(/^(sass)_.*?\.m?js$/)),
			'No Shiki language chunk was found for "sass"'
		).toHaveLength(1)
		expect(
			files.filter((fileName) => fileName.match(/^(abap|clojure|docker|ruby)_.*?\.m?js$/)),
			'Unwanted Shiki language chunks were found in the bundle'
		).toHaveLength(0)
	})

	test('Removes unused Shiki theme chunks by default', () => {
		const files = fixture?.readDir('_worker.js/chunks') ?? []
		expect(
			files.filter((fileName) => fileName.match(/^(catppuccin-.*?|dracula.*?|dark-plus)_.*?\.m?js$/)),
			'Unused Shiki theme chunks were found in the bundle'
		).toHaveLength(0)
	})

	test('Removes Shiki WASM engine if JS was selected in `engine` option', () => {
		const files = fixture?.readDir('_worker.js/chunks') ?? []
		expect(
			files.filter((fileName) => fileName.match(/^(wasm)_.*?\.m?js$/)),
			'Shiki WASM engine was found in the bundle'
		).toHaveLength(0)
	})

	const allowedBundleSizeInMb = 2.4
	test(`Total bundle size does not exceed ${allowedBundleSizeInMb} MB`, () => {
		const files = fixture?.readDirWithTypesRecursive('.') ?? []
		const fileSizes = files
			.filter((file) => !file.isDirectory())
			.map((file) => {
				const filePath = join(file.parentPath, file.name)
				return {
					path: filePath,
					size: statSync(filePath).size,
				}
			})
		fileSizes.sort((a, b) => b.size - a.size)
		const fmtKb = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`
		const largestFiles = fileSizes.slice(0, 10).map((file) => `${file.path} (${fmtKb(file.size)})`)
		const totalSize = fileSizes.reduce((total, file) => total + file.size, 0)
		const allowedBundleSizeInBytes = allowedBundleSizeInMb * 1024 * 1024
		const sizeStats = `total size: ${fmtKb(totalSize)}, allowed size: ${fmtKb(allowedBundleSizeInBytes)}`
		const errorMessage = `Bundle exceeded allowed size (${sizeStats}).\n\nLargest files:\n${largestFiles.join(',\n')}\n\nError`
		expect(totalSize, errorMessage).toBeLessThanOrEqual(allowedBundleSizeInBytes)
	})
})

describe('Integration into Astro ^5.0.0', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-5.0.0',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Renders code blocks in Markdown files', () => {
		const html = fixture?.readFile('index.html') ?? ''
		validateHtml(html, fixture)
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, fixture)
		const hast = fromHtml(html, { fragment: true })
		// Expect the inline ins marker to be applied
		const inlineInsContents = selectAll('ins', hast).map((token) => toText(token))
		expect(inlineInsContents).toEqual(['<Header />'])
	})

	test('Renders <Code> components in MDX files', () => {
		const html = fixture?.readFile('mdx-code-component/index.html') ?? ''
		validateHtml(html, fixture)
		expect(html).toContain('Code component in MDX files')
		const hast = fromHtml(html, { fragment: true })
		// Expect the inline ins marker to be applied
		const inlineInsContents = selectAll('ins', hast).map((token) => toText(token))
		expect(inlineInsContents).toEqual(['<Header />'])
	})

	test('When rendering multiple <Code> components on an MDX page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('mdx-many-code-components/index.html') ?? ''
		validateHtml(html, fixture, {
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
			expectedElementsBeforeCode: [
				// Expect the first block to contain CSS & JS links,
				// and due to the meta attribute "addStyles" triggering our custom addStylesPlugin,
				// also expect an inline style element adding our test style
				[expectStyleLink(), expectStyleElement('orange !important'), expectScriptLink()],
				[],
				[],
			],
		})
		expect(html).toContain('Many code components in an MDX file')
	})

	test('When rendering multiple <Code> components on an Astro page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('astro-many-code-components/index.html') ?? ''
		validateHtml(html, fixture, {
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
			expectedElementsBeforeCode: [
				// Expect the first block to contain CSS & JS links,
				// and due to the meta attribute "addStyles" triggering our custom addStylesPlugin,
				// also expect an inline style element adding our test style
				[expectStyleLink(), expectStyleElement('orange !important'), expectScriptLink()],
				[],
				[],
			],
		})
		expect(html).toContain('Code components in Astro files')
	})

	describe('Supports custom languages', () => {
		test('Highlights custom language nested in markdown code block', () => {
			const { mdWithNestedLangs, customLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(mdWithNestedLangs).toEqual(expect.arrayContaining(customLangTokenColors))
		})
		test('Highlights JS language nested in markdown code block after adding custom language', () => {
			const { mdWithNestedLangs, jsLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(mdWithNestedLangs).toEqual(expect.arrayContaining(jsLangTokenColors))
		})
		test('Highlights fenced code block using custom language', () => {
			const { customLang, customLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(customLang).toEqual(expect.arrayContaining(customLangTokenColors))
		})
		test('Highlights fenced code block using JS language after adding custom language', () => {
			const { jsLang, jsLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(jsLang).toEqual(expect.arrayContaining(jsLangTokenColors))
		})
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'css')
	})

	test('Emits an external script into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'js')
	})

	test('Config options from `ec.config.mjs` are merged with integration options', () => {
		const matchingAssets = enumerateAssets(fixture, 'css')
		const cssContents = fixture?.readFile(`_astro/${matchingAssets[0]}`) ?? ''
		expect(cssContents, 'Expected themes array to be fully replaced by the one in ec.config.mjs').to.not.contain('catppuccin')
		expect(
			cssContents.match(/--ec-tm-inlMarkerBrdWd:(.*?);/)?.[1],
			'Expected styleOverrides value for textMarkers.inlineMarkerBorderWidth to be overwritten by ec.config.mjs'
		).toEqual('3px')
		expect(
			cssContents.match(/--ec-tm-lineMarkerAccentWd:(.*?);/)?.[1],
			'Expected styleOverrides value for textMarkers.lineMarkerAccentWidth value to be retained in merged config'
		).toEqual('0.3rem')
	})
})

describe('Integration into Astro ^6.0.0', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-6.0.0',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Renders code blocks in Markdown files', () => {
		const html = fixture?.readFile('index.html') ?? ''
		validateHtml(html, fixture)
	})

	test('Renders code blocks in MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html, fixture)
		const hast = fromHtml(html, { fragment: true })
		// Expect the inline ins marker to be applied
		const inlineInsContents = selectAll('ins', hast).map((token) => toText(token))
		expect(inlineInsContents).toEqual(['<Header />'])
	})

	test('Renders <Code> components in MDX files', () => {
		const html = fixture?.readFile('mdx-code-component/index.html') ?? ''
		validateHtml(html, fixture)
		expect(html).toContain('Code component in MDX files')
		const hast = fromHtml(html, { fragment: true })
		// Expect the inline ins marker to be applied
		const inlineInsContents = selectAll('ins', hast).map((token) => toText(token))
		expect(inlineInsContents).toEqual(['<Header />'])
	})

	test('When rendering multiple <Code> components on an MDX page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('mdx-many-code-components/index.html') ?? ''
		validateHtml(html, fixture, {
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
			expectedElementsBeforeCode: [
				// Expect the first block to contain CSS & JS links,
				// and due to the meta attribute "addStyles" triggering our custom addStylesPlugin,
				// also expect an inline style element adding our test style
				[expectStyleLink(), expectStyleElement('orange !important'), expectScriptLink()],
				[],
				[],
			],
		})
		expect(html).toContain('Many code components in an MDX file')
	})

	test('When rendering multiple <Code> components on an Astro page, only adds styles & scripts to the first one', () => {
		const html = fixture?.readFile('astro-many-code-components/index.html') ?? ''
		validateHtml(html, fixture, {
			expectedHtmlRegExp: multiCodeComponentHtmlRegExp,
			expectedCodeBlockCount: 3,
			expectedElementsBeforeCode: [
				// Expect the first block to contain CSS & JS links,
				// and due to the meta attribute "addStyles" triggering our custom addStylesPlugin,
				// also expect an inline style element adding our test style
				[expectStyleLink(), expectStyleElement('orange !important'), expectScriptLink()],
				[],
				[],
			],
		})
		expect(html).toContain('Code components in Astro files')
	})

	describe('Supports custom languages', () => {
		test('Highlights custom language nested in markdown code block', () => {
			const { mdWithNestedLangs, customLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(mdWithNestedLangs).toEqual(expect.arrayContaining(customLangTokenColors))
		})
		test('Highlights JS language nested in markdown code block after adding custom language', () => {
			const { mdWithNestedLangs, jsLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(mdWithNestedLangs).toEqual(expect.arrayContaining(jsLangTokenColors))
		})
		test('Highlights fenced code block using custom language', () => {
			const { customLang, customLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(customLang).toEqual(expect.arrayContaining(customLangTokenColors))
		})
		test('Highlights fenced code block using JS language after adding custom language', () => {
			const { jsLang, jsLangTokenColors } = getCustomLanguageTokenColors(fixture)
			expect(jsLang).toEqual(expect.arrayContaining(jsLangTokenColors))
		})
	})

	test('Emits an external stylesheet into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'css')
	})

	test('Emits an external script into the Astro assets dir', () => {
		expectExternalAssetsToBeEmitted(fixture, 'js')
	})

	test('Config options from `ec.config.mjs` are merged with integration options', () => {
		const matchingAssets = enumerateAssets(fixture, 'css')
		const cssContents = fixture?.readFile(`_astro/${matchingAssets[0]}`) ?? ''
		expect(cssContents, 'Expected themes array to be fully replaced by the one in ec.config.mjs').to.not.contain('catppuccin')
		expect(
			cssContents.match(/--ec-tm-inlMarkerBrdWd:(.*?);/)?.[1],
			'Expected styleOverrides value for textMarkers.inlineMarkerBorderWidth to be overwritten by ec.config.mjs'
		).toEqual('3px')
		expect(
			cssContents.match(/--ec-tm-lineMarkerAccentWd:(.*?);/)?.[1],
			'Expected styleOverrides value for textMarkers.lineMarkerAccentWidth value to be retained in merged config'
		).toEqual('0.3rem')
	})
})

function validateHtml(
	html: string,
	fixture: Awaited<ReturnType<typeof buildFixture>> | undefined,
	options?: {
		emitExternalStylesheet?: boolean | undefined
		astroConfig?: AstroUserConfig | undefined
		expectedHtmlRegExp?: RegExp | undefined
		expectedCodeBlockCount?: number | undefined
		expectedElementsBeforeCode?: unknown[][] | undefined
	}
) {
	const { emitExternalStylesheet = true, astroConfig, expectedHtmlRegExp = complexHtmlRegExp, expectedCodeBlockCount = 1 } = options ?? {}

	const assetsDir = astroConfig?.build?.assets || '_astro'

	// Expect the HTML to contain the given amount of code blocks
	const codeBlocks = extractCodeBlocks(html)
	expect(codeBlocks).toHaveLength(expectedCodeBlockCount)

	// Either use the given array of expected elements before the code blocks,
	// or define our expectations based on the given options
	const expectedElementsBeforeCode = options?.expectedElementsBeforeCode ?? []
	if (!expectedElementsBeforeCode.length) {
		const expectedFirstBlockElements: unknown[] = []
		// Depending on the `emitExternalStylesheet` option, either expect an external stylesheet
		// or an inline style element
		if (emitExternalStylesheet) {
			const styleBaseHref = `${getAssetsBaseHref('.css', astroConfig?.build?.assetsPrefix, astroConfig?.base)}/${assetsDir}/`.replace(/\/+/g, '/')
			const externalStyles = enumerateAssets(fixture, 'css', assetsDir)
			const expectedStylesheetHref = `${styleBaseHref}${externalStyles[0]}`
			expectedFirstBlockElements.push(expectStyleLink(expectedStylesheetHref))
		} else {
			expectedFirstBlockElements.push(expectStyleElement())
		}
		// Expect the `scripts` capture group to contain an external script module
		const scriptBaseHref = `${getAssetsBaseHref('.js', astroConfig?.build?.assetsPrefix, astroConfig?.base)}/${assetsDir}/`.replace(/\/+/g, '/')
		const externalScripts = enumerateAssets(fixture, 'js', assetsDir)
		const expectedScriptSrc = `${scriptBaseHref}${externalScripts[0]}`
		expectedFirstBlockElements.push(expectScriptLink(expectedScriptSrc))

		// Expect the collected elements for the first block, and none for any additional blocks
		expectedElementsBeforeCode.push(expectedFirstBlockElements)
		for (let i = 1; i < expectedCodeBlockCount; i++) {
			expectedElementsBeforeCode.push([])
		}
	}

	// Collect all elements before each code block and require them to match our expectations
	const actualElementsBeforeCodePerBlock = codeBlocks.map((blockHtml) => extractTopLevelAssetsFromBlock(blockHtml))
	expect(actualElementsBeforeCodePerBlock).toEqual(expectedElementsBeforeCode)

	// Expect the HTML structure to match our regular expression
	const matches = html.match(expectedHtmlRegExp)
	expect(matches).toBeTruthy()

	// TODO: Validate that CSS variables were generated for the configured themes
	// TODO: Validate automatic theme selection based on the user's system preferences
	// TODO: Maybe add a second set of pages including two code blocks to test that the styles are deduplicated
}

async function buildFixture({
	fixtureDir,
	buildCommand,
	buildArgs,
	outputDir,
	keepPreviousBuild = false,
}: {
	fixtureDir: string
	buildCommand: string
	buildArgs?: string[] | undefined
	outputDir: string
	keepPreviousBuild?: boolean | undefined
}) {
	const fixturePath = join(__dirname, 'fixtures', fixtureDir)
	const outputDirPath = join(fixturePath, outputDir)

	if (!keepPreviousBuild) {
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
	}

	// Return an object that contains the output directory path and allows to read files from it
	return {
		path: outputDirPath,
		readFile: (filePath: string) => readFileSync(join(outputDirPath, filePath), 'utf-8'),
		readDir: (subPath: string) => readdirSync(join(outputDirPath, subPath), 'utf-8'),
		readDirWithTypes: (subPath: string) => readdirSync(join(outputDirPath, subPath), { encoding: 'utf-8', withFileTypes: true }),
		readDirWithTypesRecursive: (subPath: string) => readdirSync(join(outputDirPath, subPath), { encoding: 'utf-8', withFileTypes: true, recursive: true }),
	}
}

function enumerateAssets(fixture: Awaited<ReturnType<typeof buildFixture>> | undefined, assetType: 'js' | 'css', assetDir = '_astro') {
	if (!fixture) throw new Error('Expected fixture to be defined')
	const assets = fixture?.readDir(assetDir) ?? []
	const assetPattern = assetType === 'js' ? 'ec\\..*?\\.js' : 'ec\\..*?\\.css'
	const fileNameRegExp = new RegExp(`^${assetPattern}$`)
	return assets.filter((fileName) => fileName.match(fileNameRegExp))
}

function expectExternalAssetsToBeEmitted(fixture: Awaited<ReturnType<typeof buildFixture>> | undefined, assetType: 'js' | 'css', assetDir = '_astro') {
	if (!fixture) throw new Error('Expected fixture to be defined')
	const matchingAssets = enumerateAssets(fixture, assetType, assetDir)
	expect(matchingAssets, `Expected assetDir "${assetDir}" to contain exactly 1 asset of type "${assetType}"`).toHaveLength(1)
}

function getCustomLanguageTokenColors(fixture: Awaited<ReturnType<typeof buildFixture>> | undefined) {
	const html = fixture?.readFile('custom-language/index.html') ?? ''
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
	return { mdWithNestedLangs, customLang, jsLang, customLangTokenColors, jsLangTokenColors }
}

const ecBaseStylesPattern = escapeRegExp('.expressive-code *:not(:is(svg, svg *))')

export function expectStyleElement(requiredContent = ecBaseStylesPattern) {
	return expect.stringMatching(new RegExp(`^<style>.*?${requiredContent}.*?</style>$`)) as unknown
}

function expectStyleLink(expectedHref: string | RegExp = /\/_astro\/ec\.[a-z0-9]*?\.css/) {
	const hrefPattern = typeof expectedHref === 'string' ? escapeRegExp(expectedHref) : expectedHref.source
	return expect.stringMatching(new RegExp(`^<link rel="stylesheet" href="${hrefPattern}"`)) as unknown
}

function expectScriptLink(expectedSrc: string | RegExp = /\/_astro\/ec\.[a-z0-9]*?\.js/) {
	const srcPattern = typeof expectedSrc === 'string' ? escapeRegExp(expectedSrc) : expectedSrc.source
	return expect.stringMatching(new RegExp(`^<script type="module" src="${srcPattern}"`)) as unknown
}
