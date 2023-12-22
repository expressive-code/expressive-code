import path from 'node:path'

import {
	Application,
	Context,
	Converter,
	DeclarationReflection,
	PageEvent,
	ParameterType,
	ReferenceType,
	Reflection,
	ReflectionKind,
	SignatureReflection,
	type TypeDocOptions,
} from 'typedoc'
import type { PluginOptions as MarkdownPluginOptions } from 'typedoc-plugin-markdown'
import type { Config as MergeModulesPluginOptions } from 'typedoc-plugin-merge-modules'
import { StarlightTypeDocTheme } from './typedoc/starlight-theme'

type PartialConfig = Partial<TypeDocOptions & MarkdownPluginOptions & MergeModulesPluginOptions>

const packages = [
	'@expressive-code/core',
	'@expressive-code/plugin-frames',
	'@expressive-code/plugin-shiki',
	'@expressive-code/plugin-text-markers',
	'@expressive-code/plugin-collapsible-sections',
	'expressive-code',
	'remark-expressive-code',
	'astro-expressive-code',
]

const sourceFiles: PartialConfig = {
	entryPoints: packages.map((packageName) => `../packages/${packageName}/src/index.ts`),
	exclude: ['**/coverage/**/*', '**/node_modules/**/*', '**/dist/**/*', '**/test/**/*'],
	skipErrorChecking: true,
	tsconfig: '../tsconfig.base.json',
}

const elementFilters: PartialConfig = {
	excludeExternals: true,
	excludeInternal: true,
	excludePrivate: true,
	excludeProtected: true,
	// Allow re-exports to be included
	excludeReferences: false,
}

const outputSettings: PartialConfig = {
	readme: 'none',
	githubPages: false,
	includeVersion: false,

	disableSources: true,
	disableGit: true,
	hideInPageTOC: true,
	hideGenerator: true,
	hideParameterTypesInTitle: true,
	hidePageHeader: true,
	memberPageTitle: '{name}',
	// parametersFormat: 'table',
	// typeDeclarationFormat: 'table',

	// sort: ['kind', 'instance-first', 'required-first', 'source-order'],
	groupOrder: ['Classes', 'Constructors', 'Functions', 'Methods', 'Accessors', 'Variables', 'Interfaces', 'Type Aliases', '*'],
}

const pluginConfig: PartialConfig = {
	// Markdown plugin
	hideBreadcrumbs: true,
	hideInPageTOC: true,
	hidePageHeader: true,
	hidePageTitle: true,
	//useCodeBlocks: true,
	//// @ts-expect-error Missing exports plugin, sadly without types
	//internalModule: 'internal',
}

const typedocConfig: PartialConfig = {
	...sourceFiles,
	...elementFilters,
	...outputSettings,
	...pluginConfig,

	theme: 'starlight-theme',

	plugin: [/*'typedoc-plugin-missing-exports',*/ /*'typedoc-plugin-merge-modules',*/ 'typedoc-plugin-markdown'],
}

async function generateTypeDoc() {
	const baseOutputPath = path.resolve('.', 'scripts/dist')
	const outputDirectory = 'api'
	const outputPath = path.join(baseOutputPath, outputDirectory)

	const app = await Application.bootstrapWithPlugins(typedocConfig)
	//app.options.addReader(new TSConfigReader())

	const fixComments = (reflection: Reflection) => {
		reflection.comment?.summary?.forEach((part) => {
			if (part.kind === 'text' && part.text) {
				part.text = part.text.replace(/\r\n/g, '\n').replace(/(?<!\n)\n(?!\n|$)/g, ' ')
			}
		})
	}
	const fixDestructuredParameterNames = (signature: SignatureReflection) => {
		signature.parameters?.forEach((param) => {
			if (param.name === '__namedParameters') {
				param.name = 'options'
			}
		})
	}

	const renameModules = (declaration: DeclarationReflection) => {
		if (declaration.kind === ReflectionKind.Module) {
			declaration.name = declaration.name.replace(/\/src$/, '')
		}
	}

	app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context: Context) => {
		const findReflectionByName = (name: string) => {
			return Object.values(context.project.reflections).find((reflection) => {
				return reflection.name === name
			})
		}

		// Assign the config interface as an implemented type to all classes
		// that implement the `ResolvedExpressiveCodeEngineConfig` interface
		Object.values(context.project.reflections).forEach((reflection: Reflection) => {
			if (reflection instanceof DeclarationReflection) {
				const implementsResolvedConfig = reflection.implementedTypes?.some((type) => type.type === 'reference' && type.name === 'ResolvedExpressiveCodeEngineConfig')
				if (implementsResolvedConfig) {
					const configReflection = findReflectionByName('ExpressiveCodeEngineConfig')
					if (!configReflection) {
						throw new Error('Failed to find `ExpressiveCodeEngineConfig` reflection.')
					}
					reflection.implementedTypes?.push(ReferenceType.createResolvedReference(configReflection.name, configReflection, context.project))
				}
			}
		})
	})

	app.converter.on(Converter.EVENT_CREATE_DECLARATION, (_context: Context, declaration: DeclarationReflection) => {
		fixComments(declaration)
		renameModules(declaration)
	})

	app.converter.on(Converter.EVENT_CREATE_SIGNATURE, (_context: Context, signature: SignatureReflection) => {
		fixComments(signature)
		fixDestructuredParameterNames(signature)
	})

	app.renderer.defineTheme('starlight-theme', StarlightTypeDocTheme)
	app.renderer.on(PageEvent.END, (event: PageEvent<DeclarationReflection>) => {
		onRendererPageEnd(event)
	})
	app.options.addDeclaration({
		defaultValue: path.posix.join('/', `/${outputDirectory}${outputDirectory.endsWith('/') ? '' : '/'}`),
		help: 'The starlight-typedoc output directory containing the generated documentation markdown files relative to the `src/content/docs/` directory.',
		name: 'starlight-typedoc-output',
		type: ParameterType.String,
	})

	const reflections = await app.convert()
	if (!reflections) {
		throw new Error('Failed to generate TypeDoc documentation.')
	}

	await app.generateDocs(reflections, outputPath)
	await app.generateJson(reflections, path.join(baseOutputPath, 'api.json'))

	return { outputPath, reflections }
}

export function addFrontmatter(content: string, frontmatter: Record<string, boolean | string>) {
	const entries = Object.entries(frontmatter).map(([key, value]) => `${key}: ${value}`)

	if (entries.length === 0) {
		return content
	}

	return `---\n${entries.join('\n')}\n---\n\n${content}`
}

function onRendererPageEnd(event: PageEvent<DeclarationReflection>) {
	if (!event.contents) {
		return
	} else if (/^(.+\/)?(README|index)\.md$/.test(event.url)) {
		// Do not save `README.md` or `index.md` files anywhere
		event.preventDefault()
		return
	}

	// Remove sections containing inheritance information
	event.contents = event.contents.replace(/##+ (Inherited from|Extends|Extended By|Implements|Implementation of|Overrides)\n\n([^\n]+\n)+\n/g, '')

	event.contents = addFrontmatter(event.contents, {
		editUrl: false,
		// Wrap in quotes to prevent issue with special characters in frontmatter
		title: `"${event.model.name}"`,
	})
}

await generateTypeDoc()
