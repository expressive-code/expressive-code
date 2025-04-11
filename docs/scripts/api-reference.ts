import path from 'node:path'
import { globSync } from 'glob'
import { fixLinks, processTemplate } from './typedoc/template-processor'
import { generateTypeDoc, type PartialConfig } from './typedoc/typedoc-runner'

const packages = [
	'@expressive-code/core',
	'@expressive-code/plugin-frames',
	'@expressive-code/plugin-line-numbers',
	'@expressive-code/plugin-shiki',
	'@expressive-code/plugin-text-markers',
	'@expressive-code/plugin-collapsible-sections',
	'expressive-code',
	'rehype-expressive-code',
	'astro-expressive-code',
]

const sourceFiles: PartialConfig = {
	basePath: '../packages',
	entryPoints: packages.map((packageName) => `../packages/${packageName}/src/index.ts`),
	exclude: ['**/coverage/**/*', '**/node_modules/**/*', '**/dist/**/*', '**/test/**/*'],
	skipErrorChecking: true,
	tsconfig: '../tsconfig.base.json',
	useTsLinkResolution: true,
}

const { outputPath } = await generateTypeDoc(sourceFiles)

// Process all templates
const templateDir = './scripts/typedoc/templates'
const docsDir = './src/content/docs'
const templateFileSubpaths = globSync(`**/*.mdx`, {
	cwd: templateDir,
	posix: true,
})
templateFileSubpaths.forEach((templateFileSubpath) => {
	processTemplate({
		apiDocsPath: outputPath,
		templateFilePath: path.join(templateDir, templateFileSubpath),
		outputFilePath: path.join(docsDir, templateFileSubpath),
	})
})

fixLinks(docsDir, templateFileSubpaths)
