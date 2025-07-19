import { ExpressiveCodeCore, type ExpressiveCodeCoreConfig } from 'expressive-code/core'
import { createRendererCommon, rehypeExpressiveCodeCommon } from './common'
import type { CreateRendererDefaultOptions, RehypeExpressiveCodeCommonDefaultOptions } from './common'
import type { LoadTheme, RehypeExpressiveCodeEngineRenderer, RehypeExpressiveCodeCommonOptions } from './types'

export * from 'expressive-code/core'
export * from './types'

export type RehypeExpressiveCodeCoreOptions<T extends string = never> = RehypeExpressiveCodeCommonOptions<ExpressiveCodeCoreConfig, ExpressiveCodeCore, T> &
	([T] extends [never]
		? object
		: {
				/**
				 * This advanced option allows you to load a theme by name. When using {@link RehypeExpressiveCodeOptions} a default
				 * theme loader is provided that will load themes by name from the Shiki full bundle. When using {@link RehypeExpressiveCodeCoreOptions}
				 * with a `string` type parameter, you must provide a `customLoadTheme` function to ensure themes can be loaded by name.
				 *
				 * The `plugin-shiki` package provides theme loaders that can be used or you can provide your own:
				 * - {@link loadShikiTheme}
				 * - {@link loadShikiThemeFromBundle}
				 * - {@link loadShikiThemeFromHighlighter}
				 */
				customLoadTheme: LoadTheme<T> // require customLoadTheme when T extends string
		  })

export type RehypeExpressiveCodeCoreRenderer = RehypeExpressiveCodeEngineRenderer<ExpressiveCodeCore>

/**
 * Creates an `ExpressiveCodeCore` instance using the given `options`.
 *
 * Returns the created `ExpressiveCodeCore` instance together with the base styles and JS modules
 * that should be added to every page.
 */
export async function createRendererCore<T extends string = never>(options: RehypeExpressiveCodeCoreOptions<T>): Promise<RehypeExpressiveCodeCoreRenderer> {
	// typescript can't infer T here so it requires loadTheme but we do not provide a default loadTheme for Core,
	// customLoadTheme must be used if T extends string so we must cast
	return createRendererCommon(options, { ctor: ExpressiveCodeCore } as CreateRendererDefaultOptions<ExpressiveCodeCore, T>)
}

export function rehypeExpressiveCodeCore<T extends string = never>(options: RehypeExpressiveCodeCoreOptions<T>) {
	return rehypeExpressiveCodeCommon(options, { createRenderer: createRendererCore } as RehypeExpressiveCodeCommonDefaultOptions<T, ExpressiveCodeCore>)
}
