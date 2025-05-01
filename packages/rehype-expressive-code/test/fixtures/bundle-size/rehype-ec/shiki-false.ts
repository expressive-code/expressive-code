import { rehypeExpressiveCode, RehypeExpressiveCodeOptions } from 'rehype-expressive-code'

const options: RehypeExpressiveCodeOptions = {
	shiki: false,
}

const plugin = rehypeExpressiveCode

export { plugin, options }
