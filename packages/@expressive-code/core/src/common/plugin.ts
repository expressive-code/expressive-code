import { ExpressiveCodePluginHooks } from './plugin-hooks'

export interface ExpressiveCodePlugin {
	name: string
	hooks: ExpressiveCodePluginHooks
}
