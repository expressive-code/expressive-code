import { ExpressiveCodeEngine, ExpressiveCodeEngineConfig, ExpressiveCodePlugin } from '@expressive-code/core'
import { PluginFramesOptions, pluginFrames } from '@expressive-code/plugin-frames'
import { pluginShiki } from '@expressive-code/plugin-shiki'
import { PluginTextMarkersOptions, pluginTextMarkers } from '@expressive-code/plugin-text-markers'

export * from '@expressive-code/core'
export * from '@expressive-code/plugin-frames'
export * from '@expressive-code/plugin-shiki'
export * from '@expressive-code/plugin-text-markers'

export interface ExpressiveCodeConfig extends ExpressiveCodeEngineConfig {
	/**
	 * The Shiki plugin adds syntax highlighting to code blocks.
	 *
	 * This plugin is enabled by default. Set this to `false` to disable it.
	 */
	shiki?: boolean | undefined
	/**
	 * The Text Markers plugin allows to highlight lines and inline ranges
	 * in code blocks in various styles (e.g. marked, inserted, deleted).
	 *
	 * This plugin is enabled by default. Set this to `false` to disable it.
	 * You can also configure the plugin by setting this to an options object.
	 */
	textMarkers?: PluginTextMarkersOptions | boolean | undefined
	/**
	 * The Frames plugin adds an editor or terminal frame around code blocks,
	 * including an optional title displayed as a tab or window caption.
	 *
	 * This plugin is enabled by default. Set this to `false` to disable it.
	 * You can also configure the plugin by setting this to an options object.
	 */
	frames?: PluginFramesOptions | boolean | undefined
}

export class ExpressiveCode extends ExpressiveCodeEngine {
	constructor({ shiki, textMarkers, frames, ...baseConfig }: ExpressiveCodeConfig = {}) {
		// Collect all default plugins with their configuration,
		// but skip those that were disabled or already added to plugins
		const pluginsToPrepend: ExpressiveCodePlugin[] = []
		const baseConfigPlugins = baseConfig.plugins?.flat() || []
		const notPresentInPlugins = (name: string) => baseConfigPlugins.every((plugin) => plugin.name !== name)
		if (shiki !== false && notPresentInPlugins('Shiki')) {
			pluginsToPrepend.push(pluginShiki())
		}
		if (textMarkers !== false && notPresentInPlugins('TextMarkers')) {
			pluginsToPrepend.push(pluginTextMarkers(textMarkers !== true ? textMarkers : undefined))
		}
		if (frames !== false && notPresentInPlugins('Frames')) {
			pluginsToPrepend.push(pluginFrames(frames !== true ? frames : undefined))
		}
		// Create a new plugins array with the default plugins prepended
		const pluginsWithDefaults = [...pluginsToPrepend, ...(baseConfig.plugins || [])]
		// Call the base constructor with the new plugins array
		super({ ...baseConfig, plugins: pluginsWithDefaults })
	}
}
