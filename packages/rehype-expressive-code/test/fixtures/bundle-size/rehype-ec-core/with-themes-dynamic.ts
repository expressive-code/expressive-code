import { rehypeExpressiveCodeCore, type RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code/core'

const options: RehypeExpressiveCodeCoreOptions = {
	themes: [(await import('shiki/themes/dracula.mjs')).default],
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
