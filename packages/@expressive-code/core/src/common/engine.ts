import { ExpressiveCodePlugin } from './plugin'

export interface ExpressiveCodeConfig {
	/**
	 * To add a plugin, import its initialization function and call it inside this array.
	 *
	 * If the plugin has any configuration options, you can pass them to the initialization
	 * function as an object containing your desired property values.
	 */
	plugins: ExpressiveCodePlugin[]
}

export function expressiveCode(config: ExpressiveCodeConfig) {
	console.dir(config)
}
