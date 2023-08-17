import { AttachedPluginData, ExpressiveCodePlugin, replaceDelimitedValues } from '@expressive-code/core'
import { Section, parseSections } from './utils'
import { select } from 'hast-util-select'
import { sectionizeAst } from './ast'

export interface PluginCollapsibleSectionsOptions {
	todo?: 'expand' | undefined
}

export function pluginCollapsibleSections(_: PluginCollapsibleSectionsOptions = {}): ExpressiveCodePlugin {
	return {
		name: 'Collapsible sections',
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
				codeBlock.meta = replaceDelimitedValues(
					codeBlock.meta,
					({ fullMatch, key, value }) => {
						// if we aren't interested in the entry, just return it as-is
						if (key !== 'collapse') return fullMatch

						// otherwise add our parsed data to the codeblock, so we can later modify the AST
						const sections = parseSections(value)
						const data = pluginCollapsibleSectionsData.getOrCreateFor(codeBlock)
						data.sections = sections
						return ''
					},
					{
						valueDelimiters: ['"', "'", '{...}'],
						keyValueSeparator: '=',
					}
				)
			},
			postprocessRenderedBlock: ({ codeBlock, renderData }) => {
				const data = pluginCollapsibleSectionsData.getOrCreateFor(codeBlock)
				const codeAst = select('pre > code', renderData.blockAst)
				if (codeAst) {
					codeAst.children = sectionizeAst({
						lines: codeAst.children,
						sections: data.sections,
					})
				}
			},
		},
	}
}

export const pluginCollapsibleSectionsData = new AttachedPluginData<{ sections: Section[] }>(() => ({ sections: [] }))
