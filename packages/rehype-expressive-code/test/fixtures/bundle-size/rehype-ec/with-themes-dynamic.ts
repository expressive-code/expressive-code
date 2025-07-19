import { rehypeExpressiveCode, RehypeExpressiveCodeOptions } from 'rehype-expressive-code'

const options: RehypeExpressiveCodeOptions = {
	themes: [(await import('shiki/themes/dracula.mjs')).default],
}

const plugin = rehypeExpressiveCode

export { plugin, options }
