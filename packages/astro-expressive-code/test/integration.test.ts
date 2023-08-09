import { describe, test, expect, beforeAll } from 'vitest'
import { existsSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { sampleCodeHtmlRegExp } from '../../remark-expressive-code/test/utils'

describe('Integration into an Astro project', () => {
	let fixture: Awaited<ReturnType<typeof buildFixture>> | undefined

	beforeAll(async () => {
		fixture = await buildFixture({
			fixtureDir: 'astro',
			buildCommand: 'pnpm',
			buildArgs: ['astro', 'build'],
			outputDir: 'dist',
		})
	}, 20 * 1000)

	test('Regular Markdown files', () => {
		const html = fixture?.readFile('index.html') ?? ''
		validateHtml(html)
	})

	test('MDX files', () => {
		const html = fixture?.readFile('mdx-page/index.html') ?? ''
		validateHtml(html)
	})
})

function validateHtml(html: string) {
	expect(html).toMatch(sampleCodeHtmlRegExp)
	// Collect the class names of all code blocks
	const codeBlockClassNames = [...html.matchAll(/<div class="expressive-code (.*?)">/g)].map((match) => match[1])
	// Expect two code blocks in total (because two themes were configured)
	expect(codeBlockClassNames).toHaveLength(2)
	// Validate theme class names
	const themeClassNames = codeBlockClassNames?.map((className) => className.match(/(^|\s)(ec-theme-.*?)(\s|$)/)?.[2])
	expect(themeClassNames).toEqual(['ec-theme-github-dark', 'ec-theme-solarized-light'])
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
	}
}
