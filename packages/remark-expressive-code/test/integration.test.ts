import { describe, test, expect } from 'vitest'
import { existsSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { sampleCodeHtmlRegExp } from './utils'

describe('Integration into Astro', () => {
	test(
		'Regular Markdown files',
		async () => {
			const fixture = await buildFixture({
				fixtureDir: 'astro',
				buildCommand: 'pnpm',
				buildArgs: ['astro', 'build'],
				outputDir: 'dist',
			})
			expect(fixture.readFile('index.html')).toMatch(sampleCodeHtmlRegExp)
		},
		{ timeout: 20 * 1000 }
	)
})

async function buildFixture({ fixtureDir, buildCommand, buildArgs, outputDir }: { fixtureDir: string; buildCommand: string; buildArgs?: string[]; outputDir: string }) {
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
