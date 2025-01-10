import type { RehypeExpressiveCodeOptions } from 'rehype-expressive-code'
import type { PartialAstroConfig } from './astro-config'
import type { AstroExpressiveCodeRenderer, CreateAstroRendererArgs } from './renderer'

export type AstroExpressiveCodeOptions = RehypeExpressiveCodeOptions & {
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
	/**
	 * Controls whether any themes from the full Shiki bundle that are not used by your
	 * Expressive Code configuration should be removed from the final bundle.
	 *
	 * Defaults to `true`, which automatically reduces SSR bundle size by over 1 MB.
	 *
	 * If you need to access all themes on your site, you can set this option to `false`.
	 */
	removeUnusedThemes?: boolean | undefined
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
 * Returns a URL to the optional EC config file in the Astro project root.
 */
export function getEcConfigFileUrl(projectRootUrl: URL | string) {
	return new URL('./ec.config.mjs', projectRootUrl)
}

/**
 * Attempts to import an EC config file in the Astro project root and returns its default export.
 *
 * If no config file is found, an empty object is returned.
 */
export async function loadEcConfigFile(projectRootUrl: URL | string): Promise<AstroExpressiveCodeOptions> {
	const pathsToTry = [
		// This path works in most scenarios, but not when the integration is processed by Vite
		// due to a Vite bug affecting import URLs using the "file:" protocol
		new URL(`./ec.config.mjs?t=${Date.now()}`, projectRootUrl).href,
	]
	// Detect if the integration is processed by Vite
	if (import.meta.env?.BASE_URL?.length) {
		// Add a fallback path starting with "/", which Vite treats as relative to the project root
		pathsToTry.push(`/ec.config.mjs?t=${Date.now()}`)
	}
	/**
	 * Checks the error received on attempting to import EC config file.
	 * Bun's choice to throw ResolveMessage for import resolver messages means
	 * type comparison (error instanceof Error) isn't portable.
	 * @param error Error object, which could be string, Error, or ResolveMessage.
	 * @returns object containing message and, if present, error code.
	 */
	function coerceError(error: unknown): { message: string; code?: string | undefined } {
		if (typeof error === 'object' && error !== null && 'message' in error) {
			return error as { message: string; code?: string | undefined }
		}
		return { message: error as string }
	}
	for (const path of pathsToTry) {
		try {
			const module = (await import(/* @vite-ignore */ path)) as { default: AstroExpressiveCodeOptions }
			if (!module.default) {
				throw new Error(`Missing or invalid default export. Please export your Expressive Code config object as the default export.`)
			}
			return module.default
		} catch (error) {
			const { message, code } = coerceError(error)
			// If the config file was not found, continue with the next path (if any)
			if (code === 'ERR_MODULE_NOT_FOUND' || code === 'ERR_LOAD_URL') {
				// Ignore the error only if the config file itself was not found,
				// not if the config file failed to import another module
				// - Node: Cannot find module '.../ec.config.mjs' imported from .../astro-expressive-code/dist/index.js
				// - Bun:  Cannot find module ".../ec.config.mjs" from ".../astro-expressive-code/dist/index.js"
				// - Vite: .../ec.config.mjs at .../ec.config.mjs (imported from ...)
				if (message.replace(/(imported )?from .*$/, '').includes('ec.config.mjs')) continue
			}
			// If the config file exists, but there was a problem loading it, rethrow the error
			throw new Error(
				`Your project includes an Expressive Code config file ("ec.config.mjs")
				that could not be loaded due to ${code ? `the error ${code}` : 'the following error'}: ${message}`.replace(/\s+/g, ' '),
				error instanceof Error ? { cause: error } : undefined
			)
		}
	}
	return {}
}

/**
 * Merges the given Astro Expressive Code configuration objects into a single new result object.
 *
 * Option values from earlier objects in the argument list are overwritten by new values
 * found in later objects, including `undefined` values.
 *
 * For the following object options, a deep merge is performed instead of a simple override:
 * - `defaultProps`
 * - `frames`
 * - `shiki`
 * - `styleOverrides`
 *
 * The following array options are concatenated instead of being replaced:
 * - `shiki.langs`
 */
export function mergeEcConfigOptions(...configs: AstroExpressiveCodeOptions[]) {
	const merged: AstroExpressiveCodeOptions = {}
	configs.forEach((config) => merge(merged, config, ['defaultProps', 'frames', 'shiki', 'styleOverrides']))
	return merged

	function isObject(value: unknown): value is Record<string, unknown> {
		return value !== null && typeof value === 'object' && !Array.isArray(value)
	}

	function merge(target: Record<string, unknown>, source: Record<string, unknown>, limitDeepMergeTo?: string[], path = '') {
		for (const key in source) {
			const srcProp = source[key]
			const tgtProp = target[key]
			if (isObject(srcProp)) {
				if (isObject(tgtProp) && (!limitDeepMergeTo || limitDeepMergeTo.includes(key))) {
					merge(tgtProp, srcProp, undefined, path ? path + '.' + key : key)
				} else {
					target[key] = { ...srcProp }
				}
			} else if (Array.isArray(srcProp)) {
				if (Array.isArray(tgtProp) && path === 'shiki' && key === 'langs') {
					target[key] = [...(tgtProp as unknown[]), ...(srcProp as unknown[])]
				} else {
					target[key] = [...(srcProp as unknown[])]
				}
			} else {
				target[key] = srcProp
			}
		}
	}
}
