import { describe, test, expect, beforeAll } from 'vitest'
import { existsSync, rmSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import type { AstroUserConfig } from 'astro/config'
import { buildSampleCodeHtmlRegExp } from '../../remark-expressive-code/test/utils'

const complexHtmlRegExp = buildSampleCodeHtmlRegExp({
	title: 'src/layouts/BaseLayout.astro',
	codeContents: [
		// Expect the code to start with a collapsible section
		'<details(| .*?)>.*?</details>',
		'.*?',
		// Expect at least one code line that is marked as inserted
		'<div class="ec-line ins">',
		// Expect Shiki highlighting colors inside
		'.*?--0:#.*?',
		// Expect all elements to be closed
		'</div>',
		'.*?',
	],
})

describe('Integration into Astro ^3.0.0', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro-3.0.0',
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

describe('Integration into Astro ^3.5.0 with `emitExternalStylesheet: false`', () => {
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

describe('Integration into Astro ^3.5.0 using custom `base` and `build.assets` paths', () => {
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
	}
) {
	const { emitExternalStylesheet = true, astroConfig } = options ?? {}

	const assetsDir = astroConfig?.build?.assets || '_astro'
	const assetsBaseHref = `${astroConfig?.build?.assetsPrefix || astroConfig?.base || ''}/${assetsDir}/`.replace(/\/+/g, '/')

	// Expect the HTML structure to match our regular expression
	const matches = html.match(complexHtmlRegExp)
	expect(matches).toBeTruthy()

	// Depending on the `emitExternalStylesheet` option, expect the `styles` capture group
	// to either contain an external stylesheet or an inline style element
	const styles = matches?.groups?.['styles']
	if (emitExternalStylesheet) {
		expect(styles, `Expected a stylesheet link href beginning with "${assetsBaseHref}", but got "${styles}"`).toMatch(
			new RegExp(`<link rel="stylesheet" href="${assetsBaseHref}ec\\..*?\\.css"\\s*/?>`)
		)
	} else {
		expect(styles).toContain('<style>')
	}

	// Expect the `scripts` capture group to contain an external script module
	const scripts = matches?.groups?.['scripts']
	expect(scripts, `Expected a script module src beginning with "${assetsBaseHref}", but got "${scripts}"`).toMatch(
		new RegExp(`<script type="module" src="${assetsBaseHref}ec\\..*?\\.js"\\s*/?>`)
	)

	// Collect all code blocks
	const codeBlockClassNames = [...html.matchAll(/<div class="(expressive-code(?:| .*?))">/g)].map((match) => match[1])
	// Expect one code block in total (because our new rendering logic doesn't create multiple code blocks anymore)
	expect(codeBlockClassNames).toHaveLength(1)
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
