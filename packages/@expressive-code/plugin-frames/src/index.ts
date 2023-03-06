import { ExpressiveCodePlugin, replaceDelimitedValues } from '@expressive-code/core'

export interface FramesPluginData {
	title?: string
}

export function frames(): ExpressiveCodePlugin {
	return {
		name: 'Frames',
		hooks: {
			preprocessMetadata: ({ codeBlock, getPluginData }) => {
				const blockData = getPluginData<FramesPluginData>('block', {})

				codeBlock.meta = replaceDelimitedValues(codeBlock.meta, ({ fullMatch, key, value }) => {
					// Handle "title" and "@title" keys in meta string
					if (key === 'title' || key === '@title') {
						blockData.title = value
						return ''
					}

					// Leave all other key-value pairs untouched
					return fullMatch
				})
			},
		},
	}
}
