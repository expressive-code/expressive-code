import { AttachedPluginData, ExpressiveCodePlugin, PluginTexts, replaceDelimitedValues } from '@expressive-code/core'
import { Section, parseSections } from './utils'
import { select } from 'hast-util-select'
import { sectionizeAst } from './ast'
import { collapsibleSectionsStyleSettings, getCollapsibleSectionsBaseStyles } from './styles'

export const pluginCollapsibleSectionsTexts = new PluginTexts({
	collapsedLines: '{lineCount} collapsed {lineCount;1=line;lines}',
})

pluginCollapsibleSectionsTexts.addLocale('de', {
	collapsedLines: '{lineCount} ausgeblendete {lineCount;1=Zeile;Zeilen}',
})

export function pluginCollapsibleSections(): ExpressiveCodePlugin {
	return {
		name: 'Collapsible sections',
		styleSettings: collapsibleSectionsStyleSettings,
		baseStyles: ({ styleVariants }) => getCollapsibleSectionsBaseStyles(styleVariants),
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
				codeBlock.meta = replaceDelimitedValues(
					codeBlock.meta,
					({ fullMatch, key, value }) => {
						// If we aren't interested in the entry, just return it as-is
						if (key !== 'collapse') return fullMatch

						// Parse the given sections and store references to the targeted lines,
						// allowing us to react to potential line number changes
						const sections = parseSections(value)
						sections.forEach((section) => {
							section.lines.push(...codeBlock.getLines(section.from - 1, section.to))
						})
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
			annotateCode: ({ codeBlock }) => {
				const data = pluginCollapsibleSectionsData.getOrCreateFor(codeBlock)
				if (!data.sections.length) return
				// Update from/to line numbers to account for any line number changes
				const lines = codeBlock.getLines()
				for (let i = data.sections.length - 1; i >= 0; i--) {
					const section = data.sections[i]
					const indices = section.lines.map((line) => lines.indexOf(line)).filter((index) => index > -1)
					// If no more lines are present, remove the section
					if (!indices.length) {
						data.sections.splice(i, 1)
						continue
					}
					section.from = Math.min(...indices) + 1
					section.to = Math.max(...indices) + 1
				}
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
