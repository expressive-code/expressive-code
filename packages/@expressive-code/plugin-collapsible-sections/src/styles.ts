import { PluginStyleSettings, ResolverContext, codeLineClass, setAlpha } from '@expressive-code/core'

export const collapsibleSectionClass = 'ec-section'

export interface CollapsibleSectionsStyleSettings {
	/**
	 * The border width of closed sections.
	 * @default '0'
	 */
	closedBorderWidth: string
	/**
	 * The block padding of closed sections.
	 * @default '4px'
	 */
	closedPaddingBlock: string
	/**
	 * The margin around closed sections.
	 * @default '0'
	 */
	closedMargin: string
	/**
	 * The font family of the closed section summary text.
	 * @default 'inherit'
	 */
	closedFontFamily: string
	/**
	 * The font size of the closed section summary text.
	 * @default 'inherit'
	 */
	closedFontSize: string
	/**
	 * The line height of the closed section summary text.
	 * @default 'inherit'
	 */
	closedLineHeight: string
	/**
	 * The text color of the closed section summary text.
	 * @default 'inherit'
	 */
	closedTextColor: string
	/**
	 * The background color of closed sections.
	 * @default
	 * ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.2) || 'rgb(84 174 255 / 20%)'
	 */
	closedBackgroundColor: string
	/**
	 * The border color of closed sections.
	 * @default
	 * ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.5) || 'rgb(84 174 255 / 50%)'
	 */
	closedBorderColor: string
	/**
	 * The border width of open sections.
	 * @default '1px'
	 */
	openBorderWidth: string
	/**
	 * The padding of open sections.
	 * @default '0'
	 */
	openPadding: string
	/**
	 * The margin around open sections.
	 * @default '0'
	 */
	openMargin: string
	/**
	 * The background color of open sections.
	 * @default 'transparent'
	 */
	openBackgroundColor: string
	/**
	 * The border color of open sections.
	 * @default 'transparent'
	 */
	openBorderColor: string
}

export const collapsibleSectionsStyleSettings = new PluginStyleSettings({
	defaultValues: {
		collapsibleSections: {
			closedBorderWidth: '0',
			closedPaddingBlock: '4px',
			closedMargin: '0',
			closedFontFamily: 'inherit',
			closedFontSize: 'inherit',
			closedLineHeight: 'inherit',
			closedTextColor: 'inherit',
			closedBackgroundColor: ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.2) || 'rgb(84 174 255 / 20%)',
			closedBorderColor: ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.5) || 'rgb(84 174 255 / 50%)',
			openBorderWidth: '1px',
			openPadding: '0',
			openMargin: '0',
			openBackgroundColor: 'transparent',
			openBorderColor: 'transparent',
		},
	},
	cssVarReplacements: [['collapsibleSections', 'cs']],
})

export function getCollapsibleSectionsBaseStyles({ cssVar }: ResolverContext) {
	const result = `
		.${collapsibleSectionClass} {
			& summary {
				/* hide the default <details> marker */
				&::marker {
					display: inline-block;
					content: "";
					width: 16px;
					height: 16px;
				}

				/* workaround - ::marker does not support content on safari */
				&::-webkit-details-marker {
					display: none;
				}

				svg {
					vertical-align: text-bottom;
					fill: currentColor;
					margin-right: 1em;
					opacity: 0.75;
				}

				font-family: ${cssVar('collapsibleSections.closedFontFamily')};
				font-size: ${cssVar('collapsibleSections.closedFontSize')};
				line-height: ${cssVar('collapsibleSections.closedLineHeight')};
				user-select: none;
				-webkit-user-select: none;

				cursor: pointer;
				color: ${cssVar('collapsibleSections.closedTextColor')};
				background-color: ${cssVar('collapsibleSections.closedBackgroundColor')};
				--border-color: ${cssVar('collapsibleSections.closedBorderColor')};
				--border-width: ${cssVar('collapsibleSections.closedBorderWidth')};
				box-shadow: inset 0 calc(-1 * var(--border-width)) var(--border-color), inset 0 var(--border-width) var(--border-color);
				margin: ${cssVar('collapsibleSections.closedMargin')};

				.${codeLineClass} .code {
					padding-block: ${cssVar('collapsibleSections.closedPaddingBlock')};
					text-indent: 0;
				}
			}

			&[open] {
				/* hide the <summary> when the lines are displayed */
				& summary {
					display: none;
				}

				background-color: ${cssVar('collapsibleSections.openBackgroundColor')};
				--border-color: ${cssVar('collapsibleSections.openBorderColor')};
				--border-width: ${cssVar('collapsibleSections.openBorderWidth')};
				box-shadow: inset 0 calc(-1 * var(--border-width)) var(--border-color), inset 0 var(--border-width) var(--border-color);
				padding-inline: ${cssVar('collapsibleSections.openPadding')};
				margin-inline: ${cssVar('collapsibleSections.openMargin')};
			}
		}
	`

	return result
}
