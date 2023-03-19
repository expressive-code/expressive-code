import { ExpressiveCodePlugin } from './plugin'
import { renderGroup, RenderInput, RenderOptions } from '../internal/render-group'

export interface ExpressiveCodeConfig {
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins: ExpressiveCodePlugin[]
}

export class ExpressiveCode {
	constructor(config: ExpressiveCodeConfig) {
		this.#config = config
	}

	render(input: RenderInput, options?: RenderOptions) {
		return renderGroup({ input, options, plugins: this.#config.plugins })
	}

	readonly #config: ExpressiveCodeConfig
}
