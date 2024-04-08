import { corePlugins } from '../../../packages/@expressive-code/core/src/internal/core-plugins'

export function getCoreJsModules() {
	const jsModules: string[] = []
	for (const plugin of corePlugins) {
		if (Array.isArray(plugin.jsModules)) {
			jsModules.push(...plugin.jsModules)
		}
	}
	return jsModules
}
