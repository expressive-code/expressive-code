import { rehypeExpressiveCode, RehypeExpressiveCodeOptions } from 'rehype-expressive-code'
import dracula from 'shiki/themes/dracula.mjs'

const options: RehypeExpressiveCodeOptions = {
	themes: [dracula],
}

const plugin = rehypeExpressiveCode

export { plugin, options }
