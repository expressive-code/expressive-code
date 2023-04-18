import { PluginFramesOptions, pluginFrames } from '@expressive-code/plugin-frames'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { PluginTextMarkersOptions, pluginTextMarkers } from '@expressive-code/plugin-text-markers'

export * from '@expressive-code/core'
export * from '@expressive-code/plugin-frames'
export * from '@expressive-code/plugin-shiki'
export * from '@expressive-code/plugin-text-markers'

/**
 * Provides a convenient way to add all default plugins bundled with Expressive Code.
 *
 * This allows you to add `defaultPlugins()` instead of
 * `[pluginShiki(), pluginTextMarkers(), pluginFrames()]`.
 *
 * @example
 * import { ExpressiveCode, defaultPlugins } from 'expressive-code'
 *
 * const ec = new ExpressiveCode({
 *   plugins: [defaultPlugins()],
 * })
 */
export function defaultPlugins({ textMarkersOptions = {}, framesOptions = {} }: { textMarkersOptions?: PluginTextMarkersOptions; framesOptions?: PluginFramesOptions } = {}) {
	return [pluginShiki(), pluginTextMarkers(textMarkersOptions), pluginFrames(framesOptions)]
}
