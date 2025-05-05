import { ExpressiveCodePlugin, ExpressiveCodeTheme } from '@expressive-code/core'
import { bundledLanguages as shikiBundledLanguages, bundledThemes as shikiBundledThemes, type BundledLanguage } from 'shiki'
import type { LanguageInput } from './languages'
import type { PluginShikiCoreOptions } from './core'
import { pluginShikiBundle } from './core'

export interface PluginShikiOptions extends PluginShikiCoreOptions<BundledShikiLanguage> {
	/**
	 * A list of additional languages that should be available for syntax highlighting.
	 *
	 * By default, all languages from the Shiki full bundle are included and available
	 * for syntax highlighting.
	 *
	 * You can pass any of the language input types supported by Shiki, e.g.:
	 * - `import('./some-exported-grammar.mjs')`
	 * - `async () => JSON.parse(await fs.readFile('some-json-grammar.json', 'utf-8'))`
	 *
	 * Any languages specified will be eagerly loaded.
	 *
	 * See the Shiki documentation for more information on [Loading Custom Languages](https://shiki.style/guide/load-lang)
	 * and [Full Bundle Preset](https://shiki.style/guide/bundles#shiki-bundle-full).
	 */
	langs?: LanguageInput[] | undefined

	/**
	 * The RegExp engine to use for syntax highlighting.
	 *
	 * - `'oniguruma'`: The default engine that supports all grammars,
	 *   but requires WebAssembly support.
	 * - `'javascript'`: A pure JavaScript engine that does not require WebAssembly.
	 */
	engine?: 'oniguruma' | 'javascript' | undefined
}

/**
 * A list of all themes bundled with Shiki.
 */
export type BundledShikiTheme = Exclude<keyof typeof shikiBundledThemes, 'css-variables'>

/**
 * A list of all languages bundled with Shiki.
 */
export type BundledShikiLanguage = BundledLanguage

/**
 * Loads a theme bundled with Shiki for use with Expressive Code.
 */
export async function loadShikiTheme(bundledThemeName: BundledShikiTheme) {
	const registration = shikiBundledThemes[bundledThemeName]
	if (!registration) {
		throw new Error(`Failed to find theme ${bundledThemeName}. Please ensure that you've provided a valid Shiki theme name.`)
	}
	const shikiTheme = await registration().then((m) => m.default)
	return new ExpressiveCodeTheme(shikiTheme)
}

export function pluginShiki(options: PluginShikiOptions = {}): ExpressiveCodePlugin {
	const { engine, ...rest } = options
	return pluginShikiBundle({
		...rest,
		bundledLangs: shikiBundledLanguages,
		bundledThemes: shikiBundledThemes,
		engine: () => createRegexEngine(engine),
	})
}

async function createRegexEngine(engine: PluginShikiOptions['engine']) {
	// The [...engine...][0] syntax makes it easier to find this code in the built package,
	// allowing astro-expressive-code to remove unused engines from the SSR bundle
	// TODO: This could be adjusted to use direct imports if/when astro-expressive-code is updated
	// to adopt the new strategy of reducing bundle size. For now, these must remain
	// as dynamic imports since one of these files may not be available.
	if (engine === 'javascript') return [(await import('shiki/engine/javascript')).createJavaScriptRegexEngine({ forgiving: true })][0]
	return [(await import('shiki/engine/oniguruma')).createOnigurumaEngine(import('shiki/wasm'))][0]
}
