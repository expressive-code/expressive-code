import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'

const options: RehypeExpressiveCodeCoreOptions = {
	themes: [],
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
