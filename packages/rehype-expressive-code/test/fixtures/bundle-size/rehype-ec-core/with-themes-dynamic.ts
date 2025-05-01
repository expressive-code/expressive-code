import { rehypeExpressiveCodeCore, RehypeExpressiveCodeCoreOptions } from 'rehype-expressive-code'

const options: RehypeExpressiveCodeCoreOptions = {
	themes: [(await import('shiki/themes/dracula.mjs')).default],
}

const plugin = rehypeExpressiveCodeCore

export { plugin, options }
