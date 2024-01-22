import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RemarkExpressiveCodeOptions } from 'remark-expressive-code'
import type { PartialAstroConfig } from './astro-config'
import type { AstroExpressiveCodeRenderer, CreateAstroRendererArgs } from './renderer'

export type AstroExpressiveCodeOptions = RemarkExpressiveCodeOptions & {
	/**
	 * Determines if the styles required to display code blocks should be emitted into a separate
	 * CSS file rather than being inlined into the rendered HTML of the first code block per page.
	 *
	 * This is recommended for sites containing multiple pages with code blocks, as it will reduce
	 * the overall footprint of the site when navigating between pages.
	 *
	 * The generated URL is located inside Astro's assets directory and includes a content hash
	 * so it can be cached indefinitely by browsers. If you are using the default values for the
	 * Astro config options `base`, `build.assets`, `build.assetsPrefix`, the resulting URL
	 * will be `/_astro/ec.{hash}.css`.
	 *
	 * **Important**: To actually benefit from caching, please ensure that your hosting provider
	 * serves the contents of the assets directory as immutable files with a long cache lifetime,
	 * e.g. `Cache-Control: public,max-age=31536000,immutable`.
	 *
	 * @default true
	 */
	emitExternalStylesheet?: boolean | undefined
	/**
	 * This advanced option allows you to influence the rendering process by creating
	 * your own `AstroExpressiveCodeRenderer` or processing the base styles and JS modules
	 * added to every page.
	 *
	 * The return value will be cached and used for all code blocks on the site.
	 */
	customCreateAstroRenderer?: ((args: CreateAstroRendererArgs) => Promise<AstroExpressiveCodeRenderer> | AstroExpressiveCodeRenderer) | undefined
	/**
	 * This advanced option allows you to preprocess the Expressive Code configuration
	 * before it is used by the Astro integration or its exported `<Code>` component.
	 *
	 * For example, Starlight uses this option to provide different default settings
	 * and additional theme options.
	 */
	customConfigPreprocessors?: CustomConfigPreprocessors | undefined
}

export type CustomConfigPreprocessors = {
	/**
	 * To perform preprocessing on the Expressive Code configuration before it is used
	 * by the Astro integration, set this property to a function. It will be called with
	 * an object argument that contains the following properties:
	 * - `ecConfig`: an Expressive Code config object merged from the optional EC config file
	 *   `ec.config.mjs` and any options passed directly to the integration
	 * - `astroConfig`: an object containing commonly used settings from the Astro configuration
	 *
	 * The return value must be a valid Expressive Code configuration object.
	 */
	preprocessAstroIntegrationConfig: ConfigPreprocessorFn
	/**
	 * If you set `preprocessAstroIntegrationConfig` to a function, you must also set this property
	 * to the JS source code of a Vite virtual module that exports the same function as its
	 * default export.
	 *
	 * This is necessary to allow the `<Code>` component to access the same preprocessed config
	 * as the Astro integration. The Astro integration cannot share the function directly with
	 * the `<Code>` component because it runs in a separate Vite instance.
	 */
	preprocessComponentConfig: string
}

export type ConfigPreprocessorFn = (args: { ecConfig: unknown; astroConfig: PartialAstroConfig }) => Promise<AstroExpressiveCodeOptions> | AstroExpressiveCodeOptions

/**
 * Returns an array of supported absolute EC config file paths in the Astro project root.
 */
export function getSupportedEcConfigFilePaths(projectRootUrl: URL) {
	const projectRootPath = fileURLToPath(projectRootUrl)
	return [resolve(projectRootPath, 'ec.config.mjs')]
}

/**
 * Returns the first existing config file path of {@link getSupportedEcConfigFilePaths}.
 */
export function findEcConfigFilePath(projectRootUrl: URL) {
	const ecConfigFile = getSupportedEcConfigFilePaths(projectRootUrl).find((fileName) => existsSync(fileName))
	return ecConfigFile
}

/**
 * Attempts to import an EC config file in the Astro project root and returns its default export.
 *
 * If no config file is found, an empty object is returned.
 */
export async function loadEcConfigFile(projectRootUrl: URL): Promise<AstroExpressiveCodeOptions> {
	const pathsToTry = [
		// This path works in most scenarios, but not when the integration is processed by Vite
		// due to a Vite bug affecting import URLs using the "file:" protocol
		new URL(`./ec.config.mjs`, projectRootUrl).href,
	]
	// Detect if the integration is processed by Vite
	if (import.meta.env?.BASE_URL?.length) {
		// Add a fallback path starting with "/", which Vite treats as relative to the project root
		pathsToTry.push(`/ec.config.mjs`)
	}
	for (const path of pathsToTry) {
		try {
			const module = (await import(/* @vite-ignore */ path)) as { default: AstroExpressiveCodeOptions }
			return module.default
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			const code = (error as { code?: string | undefined }).code
			// If the config file was found, but there was a problem loading it, rethrow the error
			if (code && code !== 'ERR_MODULE_NOT_FOUND' && code !== 'ERR_LOAD_URL') {
				throw new Error(
					`Your project includes an Expressive Code config file ("ec.config.mjs")
					that could not be loaded due to the error ${code}: ${msg}`.replace(/\s+/g, ' '),
					{ cause: error }
				)
			}
		}
	}
	return {}
}
