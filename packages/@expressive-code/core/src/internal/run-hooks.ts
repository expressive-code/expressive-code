import type { ResolvedExpressiveCodeEngineConfig } from '../common/engine'
import type { ExpressiveCodePlugin } from '../common/plugin'
import type { ExpressiveCodePluginHooks } from '../common/plugin-hooks'
import { logErrorDetails } from '../common/logger'

/**
 * Runs the given `runner` function for every hook that was registered by plugins
 * for the given hook type.
 *
 * The runner function is called with an object containing the hook name, the hook function
 * registered by the plugin, and the plugin that registered it.
 *
 * Errors occuring in the runner function are caught and rethrown with information about the
 * plugin and hook that caused the error.
 */
export async function runHooks<HookType extends keyof ExpressiveCodePluginHooks>(
	key: HookType,
	context: {
		plugins: readonly ExpressiveCodePlugin[]
		config: ResolvedExpressiveCodeEngineConfig
	},
	runner: (hook: { hookName: HookType; hookFn: NonNullable<ExpressiveCodePluginHooks[HookType]>; plugin: ExpressiveCodePlugin }) => void | Promise<void>
) {
	const { plugins, config } = context
	for (const plugin of plugins) {
		const hookFn = plugin.hooks?.[key]
		if (!hookFn) continue

		try {
			await runner({ hookName: key, hookFn, plugin })
		} catch (error) {
			/* c8 ignore next */
			const msg = error instanceof Error ? error.message : (error as string)
			const prefix = `Plugin "${plugin.name}" caused an error in its "${key}" hook.`
			logErrorDetails({ logger: config.logger, prefix, error })
			throw new Error(`${prefix} Error message: ${msg}`, { cause: error })
		}
	}
}
