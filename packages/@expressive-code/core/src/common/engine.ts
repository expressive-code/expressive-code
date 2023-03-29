import githubDark from 'shiki/themes/github-dark.json'
import { ExpressiveCodePlugin } from './plugin'
import { renderGroup, RenderInput, RenderOptions } from '../internal/render-group'
import { ExpressiveCodeTheme } from './theme'

export interface ExpressiveCodeConfig {
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins: ExpressiveCodePlugin[]
	/**
	 * The theme that should be used when rendering.
	 *
	 * Defaults to the `github-dark` theme bundled with Shiki.
	 */
	theme?: ExpressiveCodeTheme
}

export class ExpressiveCode {
	constructor(config: ExpressiveCodeConfig) {
		this.plugins = config.plugins
		this.theme = config.theme || new ExpressiveCodeTheme(githubDark)
	}

	async render(input: RenderInput, options?: RenderOptions) {
		return await renderGroup({ input, options, theme: this.theme, plugins: this.plugins })
	}

	readonly theme: ExpressiveCodeTheme
	readonly plugins: readonly ExpressiveCodePlugin[]
}
