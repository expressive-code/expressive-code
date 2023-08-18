import { AttachedPluginData, ExpressiveCodePlugin, PluginTexts, replaceDelimitedValues } from '@expressive-code/core'
import { Section, parseSections } from './utils'
import { select } from 'hast-util-select'
import { sectionizeAst } from './ast'
import { collapsibleSectionsStyleSettings, getCollapsibleSectionsBaseStyles } from './styles'

export interface PluginCollapsibleSectionsOptions {
	styleOverrides?: Partial<typeof collapsibleSectionsStyleSettings.defaultSettings> | undefined
}

export const pluginCollapsibleSectionsTexts = new PluginTexts({
	collapsedLines: (count: number) => `${count} collapsed line${count === 1 ? '' : 's'}`,
})

pluginCollapsibleSectionsTexts.addLocale('de', {
	collapsedLines: (count: number) => `${count} ausgeblendete Zeile${count === 1 ? '' : 'n'}`,
})

export function pluginCollapsibleSections(options: PluginCollapsibleSectionsOptions = {}): ExpressiveCodePlugin {
	return {
		name: 'Collapsible sections',
		baseStyles: ({ theme, coreStyles }) => getCollapsibleSectionsBaseStyles(theme, coreStyles, options.styleOverrides || {}),
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
			postprocessRenderedBlock: ({ codeBlock, renderData, locale }) => {
				const data = pluginCollapsibleSectionsData.getOrCreateFor(codeBlock)
				if (!data.sections.length) return
				const codeAst = select('pre > code', renderData.blockAst)
				if (!codeAst) return
				codeAst.children = sectionizeAst({
					lines: codeAst.children,
					sections: data.sections,
					text: pluginCollapsibleSectionsTexts.get(locale).collapsedLines,
				})
			},
		},
	}
}

export const pluginCollapsibleSectionsData = new AttachedPluginData<{ sections: Section[] }>(() => ({ sections: [] }))
