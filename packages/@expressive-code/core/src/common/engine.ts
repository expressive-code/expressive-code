import githubDark from 'shiki/themes/github-dark.json'
import { ExpressiveCodePlugin } from './plugin'
import { renderGroup, RenderInput, RenderOptions } from '../internal/render-group'
import { ExpressiveCodeTheme } from './theme'
import { PluginStyles, processPluginStyles } from '../internal/css'
import { coreStyleSettings, getCoreBaseStyles } from './core-styles'
import { UnresolvedCoreStyleSettings } from '../helpers/style-settings'

export interface ExpressiveCodeConfig {
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins: ExpressiveCodePlugin[]
	/**
	 * The color theme that should be used when rendering.
	 *
	 * Defaults to the `github-dark` theme bundled with Shiki.
	 */
	theme?: ExpressiveCodeTheme
	/**
	 * An optional set of style overrides that can be used to customize the appearance of
	 * the rendered code blocks without having to write custom CSS. You can customize core
	 * colors, fonts, paddings and more.
	 *
	 * If any of the settings are not given, default values will be used or derived from the theme,
	 * as seen in the exported `coreStyleSettings` object.
	 *
	 * **Tip:** If your site uses CSS variables for styling, you can also use these overrides
	 * to replace any core style with a CSS variable reference, e.g. `var(--your-css-var)`.
	 */
	styleOverrides?: Partial<UnresolvedCoreStyleSettings<keyof typeof coreStyleSettings.defaultSettings>>
}

export class ExpressiveCode {
	constructor(config: ExpressiveCodeConfig) {
		this.plugins = config.plugins
		this.theme = config.theme || new ExpressiveCodeTheme(githubDark)
		this.styleOverrides = {
			...config.styleOverrides,
		}
	}

	async render(input: RenderInput, options?: RenderOptions) {
		return await renderGroup({ input, options, theme: this.theme, plugins: this.plugins })
	}

	async getBaseStyles(): Promise<string> {
		const collectedStyles: PluginStyles[] = []
		// Resolve core styles
		const coreStyles = coreStyleSettings.resolve({
			theme: this.theme,
			styleOverrides: this.styleOverrides,
			// @ts-expect-error We have no resolved core styles here as we are just resolving them.
			// Attempts to access them at this point are a programming error, so we pass `null`
			// to ensure an error will be thrown if anyone tries to. As `ExpressiveCodeConfig`
			// uses `UnresolvedCoreStyleSettings` as its `styleOverrides` type, `coreStyles`
			// will not be available in resolver functions anyway.
			coreStyles: null,
		})
		// Generate core base styles using the resolved core styles
		collectedStyles.push({
			pluginName: 'core',
			styles: getCoreBaseStyles({
				theme: this.theme,
				coreStyles,
			}),
		})
		// Add plugin base styles
		this.plugins.forEach((plugin) => {
			if (!plugin.baseStyles) return
			collectedStyles.push({
				pluginName: plugin.name,
				styles: typeof plugin.baseStyles === 'function' ? plugin.baseStyles({ theme: this.theme, coreStyles }) : plugin.baseStyles,
			})
		})
		// Process styles (scoping, minifying, etc.)
		const processedStyles = await processPluginStyles(collectedStyles)
		return [...processedStyles].join('')
	}

	readonly theme: ExpressiveCodeTheme
	readonly plugins: readonly ExpressiveCodePlugin[]
	readonly styleOverrides: Partial<typeof coreStyleSettings.defaultSettings>
}
