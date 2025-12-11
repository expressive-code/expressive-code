import type { BundleThemeName, ThemeObjectOrBundleThemeName, RehypeExpressiveCodeEngineRenderer, RehypeExpressiveCodeCommonOptions } from './types'
import { createRendererCommon, rehypeExpressiveCodeCommon } from './common'
import { loadShikiTheme, ExpressiveCode } from 'expressive-code'
import type { BundledShikiTheme, ExpressiveCodeConfig } from 'expressive-code'

export * from 'expressive-code'
export * from './types'

export type RehypeExpressiveCodeOptions = RehypeExpressiveCodeCommonOptions<ExpressiveCodeConfig, ExpressiveCode, BundleThemeName<BundledShikiTheme>>

export type ThemeObjectOrShikiThemeName = ThemeObjectOrBundleThemeName<BundledShikiTheme>

export type RehypeExpressiveCodeRenderer = RehypeExpressiveCodeEngineRenderer<ExpressiveCode>

/**
 * Creates an `ExpressiveCode` instance using the given `options`,
 * including support to load themes bundled with Shiki by name.
 *
 * Returns the created `ExpressiveCode` instance together with the base styles and JS modules
 * that should be added to every page.
 */
export async function createRenderer(options: RehypeExpressiveCodeOptions): Promise<RehypeExpressiveCodeRenderer> {
	return createRendererCommon(options, { ctor: ExpressiveCode, loadTheme: loadShikiTheme })
}

export function rehypeExpressiveCode(options: RehypeExpressiveCodeOptions = {}) {
	return rehypeExpressiveCodeCommon<BundledShikiTheme, ExpressiveCode>(options, { createRenderer })
}

export default rehypeExpressiveCode
