import { GroupContents, RenderedGroupContents } from '../internal/render-group'
import { ExpressiveCodeBlock } from './block'

export type PluginDataTarget = ExpressiveCodeBlock | GroupContents | RenderedGroupContents

/**
 * A class that allows plugins to attach custom data to objects like code blocks,
 * and to optionally allow external access to this data in a type-safe manner.
 */
export class AttachedPluginData<PluginDataType> {
	private readonly dataStorage = new WeakMap<object, PluginDataType>()
	private readonly getInitialValueFn: () => PluginDataType

	constructor(getInitialValueFn: () => PluginDataType) {
		this.getInitialValueFn = getInitialValueFn
	}

	public getOrCreateFor(target: PluginDataTarget): PluginDataType {
		let data = this.dataStorage.get(target)
		if (data === undefined) {
			data = this.getInitialValueFn()
			this.dataStorage.set(target, data)
		}
		return data
	}

	public setFor(target: PluginDataTarget, data: PluginDataType) {
		this.dataStorage.set(target, data)
	}
}
