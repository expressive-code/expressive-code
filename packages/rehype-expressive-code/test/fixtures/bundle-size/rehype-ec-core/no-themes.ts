import { rehypeExpressiveCodeCore, RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code'

const options: RehypeExpressiveCodeCoreOptions = {
	themes: [],
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
