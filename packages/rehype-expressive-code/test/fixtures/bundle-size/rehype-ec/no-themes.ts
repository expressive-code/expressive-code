import { rehypeExpressiveCode, RehypeExpressiveCodeOptions } from 'rehype-expressive-code'

const options: RehypeExpressiveCodeOptions = {
	themes: [],
}

const plugin = rehypeExpressiveCode

export { plugin, options }
