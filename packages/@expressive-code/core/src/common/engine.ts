import githubDark from 'shiki/themes/github-dark.json'
import { ExpressiveCodePlugin } from './plugin'
import { renderGroup, RenderInput, RenderOptions } from '../internal/render-group'
import { ExpressiveCodeTheme } from './theme'
import { PluginStyles, processPluginStyles } from '../internal/css'
import { coreStyleSettings, getCoreBaseStyles, ResolvedCoreStyles } from './core-styles'
import { UnresolvedCoreStyleSettings } from '../helpers/style-settings'
import { getStableObjectHash } from '../helpers/objects'

export interface ExpressiveCodeConfig {
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
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins?: ExpressiveCodePlugin[]
}

export class ExpressiveCode {
	constructor(config: ExpressiveCodeConfig) {
		this.theme = config.theme || new ExpressiveCodeTheme(githubDark)
		this.styleOverrides = {
			...config.styleOverrides,
		}
		this.plugins = config.plugins || []

		// Resolve core styles based on the given theme and style overrides
		this.coreStyles = coreStyleSettings.resolve({
			theme: this.theme,
			styleOverrides: this.styleOverrides,
			// @ts-expect-error We have no resolved core styles here as we are just resolving them.
			// Attempts to access them at this point are a programming error, so we pass `null`
			// to ensure an error will be thrown if anyone tries to. As `ExpressiveCodeConfig`
			// uses `UnresolvedCoreStyleSettings` as its `styleOverrides` type, `coreStyles`
			// will not be available in resolver functions anyway.
			coreStyles: null,
		})

		// Generate a unique class name for the wrapper element based on the config
		const configHash = getStableObjectHash(
			{
				theme: this.theme,
				styleOverrides: this.styleOverrides,
				plugins: this.plugins,
			},
			{ includeFunctionContents: true }
		)
		this.configClassName = `ec-${configHash}`
	}

	async render(input: RenderInput, options?: RenderOptions) {
		return await renderGroup({
			input,
			options,
			theme: this.theme,
			// Also pass resolved core styles in case plugins need them
			coreStyles: this.coreStyles,
			plugins: this.plugins,
			configClassName: this.configClassName,
		})
	}

	async getBaseStyles(): Promise<string> {
		const pluginStyles: PluginStyles[] = []
		// Add core base styles
		pluginStyles.push({
			pluginName: 'core',
			styles: getCoreBaseStyles({
				theme: this.theme,
				coreStyles: this.coreStyles,
			}),
		})
		// Add plugin base styles
		this.plugins.forEach((plugin) => {
			if (!plugin.baseStyles) return
			pluginStyles.push({
				pluginName: plugin.name,
				styles: typeof plugin.baseStyles === 'function' ? plugin.baseStyles({ theme: this.theme, coreStyles: this.coreStyles }) : plugin.baseStyles,
			})
		})
		// Process styles (scoping, minifying, etc.)
		const processedStyles = await processPluginStyles({ pluginStyles, configClassName: this.configClassName })
		return [...processedStyles].join('')
	}

	readonly theme: ExpressiveCodeTheme
	readonly styleOverrides: Partial<typeof coreStyleSettings.defaultSettings>
	readonly coreStyles: ResolvedCoreStyles
	readonly plugins: readonly ExpressiveCodePlugin[]
	/**
	 * This class name is used by Expressive Code when rendering its wrapper element
	 * around all code block groups.
	 *
	 * Its format is `ec-<hash>`, where `<hash>` is calculated based on the config options
	 * that were passed to the class constructor. This allows you to render multiple code blocks
	 * with different configurations on the same page without having to worry about CSS conflicts.
	 *
	 * Non-global CSS styles returned by the `getBaseStyles` and `render` methods
	 * are scoped automatically using this class name.
	 *
	 * **Note to website authors:** The default class `expressive-code` is also added to all
	 * wrapper elements, providing you with a way to target all code blocks in CSS
	 * regardless of the config options.
	 */
	readonly configClassName: string
}
