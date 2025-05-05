import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'
import { pluginFrames } from '@expressive-code/plugin-frames'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'
import { pluginShiki } from '@expressive-code/plugin-shiki'

const options: RehypeExpressiveCodeCoreOptions = {
	themes: [],
	plugins: [pluginShiki(), pluginFrames(), pluginTextMarkers()],
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
