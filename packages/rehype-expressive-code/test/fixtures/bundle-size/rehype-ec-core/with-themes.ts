import { rehypeExpressiveCodeCore, RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code'
import dracula from 'shiki/themes/dracula.mjs'

const options: RehypeExpressiveCodeCoreOptions = {
	themes: [dracula],
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
