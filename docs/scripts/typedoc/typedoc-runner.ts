import path from 'node:path'

import {
	Application,
	Comment,
	Context,
	Converter,
	DeclarationReflection,
	PageEvent,
	ParameterType,
	ReferenceType,
	Reflection,
	ReflectionKind,
	SignatureReflection,
	type CommentDisplayPart,
	type TypeDocOptions,
} from 'typedoc'
import type { PluginOptions as MarkdownPluginOptions } from 'typedoc-plugin-markdown'
import { StarlightTypeDocTheme } from './typedoc-theme'
import { normalizeLineEndings } from '../../../scripts/lib/utils'

export type PartialConfig = Partial<TypeDocOptions & MarkdownPluginOptions>

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
	parametersFormat: 'table',
	typeDeclarationFormat: 'table',

	sort: ['required-first', 'alphabetical'],
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
	...elementFilters,
	...outputSettings,
	...pluginConfig,

	theme: 'starlight-theme',

	plugin: ['typedoc-plugin-rename-defaults', 'typedoc-plugin-missing-exports', 'typedoc-plugin-markdown'],
}

export async function generateTypeDoc(sourceFiles: PartialConfig) {
	const outputDirectory = 'api'
	const docsOutputPath = path.resolve('./scripts/dist', outputDirectory)
	const jsonOutputPath = path.resolve('./scripts/dist/api.json')

	const app = await Application.bootstrapWithPlugins({
		...sourceFiles,
		...typedocConfig,
	})
	//app.options.addReader(new TSConfigReader())

	const fixComments = (reflection: Reflection) => {
		const fixCommentParts = (parts: CommentDisplayPart[] | undefined) => {
			if (!parts) return
			parts.forEach((part) => {
				if (part.kind === 'text' && part.text) {
					part.text = normalizeLineEndings(part.text).replace(/(?<!\n)\n[ \t]*(?!\n|[ \t]*-|$)/g, ' ')
				}
				if (part.kind === 'code' && part.text) {
					part.text = normalizeLineEndings(part.text)
				}
			})
		}

		const fixComment = (comment: Comment | undefined) => {
			if (!comment) return
			fixCommentParts(comment.summary)
			comment.blockTags?.forEach((tag) => {
				fixCommentParts(tag.content)
			})
		}

		fixComment(reflection.comment)
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
		renameModules(declaration)
	})

	app.converter.on(Converter.EVENT_CREATE_SIGNATURE, (_context: Context, signature: SignatureReflection) => {
		fixDestructuredParameterNames(signature)
	})

	app.converter.on(Converter.EVENT_END, (context: Context) => {
		Object.values(context.project.reflections).forEach((reflection: Reflection) => {
			fixComments(reflection)
		})
	})

	// eslint-disable-next-line @typescript-eslint/unbound-method
	const originalWarn = app.logger.warn
	app.logger.warn = (text: string, ...args: unknown[]) => {
		if (text.includes('You are running with an unsupported TypeScript version!')) {
			return
		}
		originalWarn.apply(app.logger, [text, ...args] as Parameters<typeof originalWarn>)
	}

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

	await app.generateDocs(reflections, docsOutputPath)
	await app.generateJson(reflections, jsonOutputPath)

	return { outputPath: docsOutputPath, reflections }
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
	event.contents = event.contents.replace(/##+ (Implements)\n\n([^\n]+\n)+\n/g, '')

	event.contents = `# ${event.model.name}\n\n${event.contents}`

	event.filename = event.filename.replace(/\.md$/, '.mdx')
}
