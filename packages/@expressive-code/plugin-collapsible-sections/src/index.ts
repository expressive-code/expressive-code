import { AttachedPluginData, ExpressiveCodePlugin, PluginTexts, cssVarReplacements } from '@expressive-code/core'
import { Section, parseSections } from './utils'
import { select } from 'hast-util-select'
import { sectionizeAst } from './ast'
import { CollapsibleSectionsStyleSettings, collapsibleSectionsStyleSettings, getCollapsibleSectionsBaseStyles } from './styles'

export { CollapsibleSectionsStyleSettings }

declare module '@expressive-code/core' {
	export interface StyleSettings {
		collapsibleSections: CollapsibleSectionsStyleSettings
	}
}

export interface PluginCollapsibleSectionsProps {
	/**
	 * Collapses the given line range or ranges.
	 */
	collapse: string | string[]
}

declare module '@expressive-code/core' {
	export interface ExpressiveCodeBlockProps extends PluginCollapsibleSectionsProps {}
}

export const pluginCollapsibleSectionsTexts = new PluginTexts({
	collapsedLines: '{lineCount} collapsed {lineCount;1=line;lines}',
})

pluginCollapsibleSectionsTexts.addLocale('de', {
	collapsedLines: '{lineCount} ausgeblendete {lineCount;1=Zeile;Zeilen}',
})

export function pluginCollapsibleSections(): ExpressiveCodePlugin {
	cssVarReplacements.set('collapsibleSections', 'cs')
	return {
		name: 'Collapsible sections',
		styleSettings: collapsibleSectionsStyleSettings,
		baseStyles: (context) => getCollapsibleSectionsBaseStyles(context),
		hooks: {
			preprocessMetadata: ({ codeBlock }) => {
				const toArray = (value: string | string[] | undefined) => {
					if (value === undefined) return []
					return Array.isArray(value) ? value : [value]
				}

				// Merge any ranges from the `collapse` meta option into the `collapse` prop
				const ranges = [...toArray(codeBlock.props.collapse), ...codeBlock.metaOptions.getRanges('collapse')]
				codeBlock.props.collapse = ranges
				if (!ranges) return
				// Parse the given ranges into sections and store references to the targeted lines,
				// allowing us to react to potential line number changes
				const sections = parseSections(ranges.join(','))
				sections.forEach((section) => {
					section.lines.push(...codeBlock.getLines(section.from - 1, section.to))
				})
				const data = pluginCollapsibleSectionsData.getOrCreateFor(codeBlock)
				data.sections = sections
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
