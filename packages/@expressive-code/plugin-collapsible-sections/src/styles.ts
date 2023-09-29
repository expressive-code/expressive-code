import { StyleOverrides } from '@expressive-code/core'
import { StyleSettings, ExpressiveCodeTheme, ResolvedCoreStyles, setAlpha } from '@expressive-code/core'

export const collapsibleSectionClass = 'ec-section'

export interface CollapsibleSectionsStyleSettings {
	/**
	 * The border width of closed sections.
	 * @default '0'
	 */
	closedBorderWidth: string
	/**
	 * The padding of closed sections.
	 * @default '4px 0 4px var(--padding-inline)'
	 */
	closedPadding: string
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

export const collapsibleSectionsStyleSettings = new StyleSettings<CollapsibleSectionsStyleSettings>({
	styleOverridesSubpath: 'collapsibleSections',
	defaultSettings: {
		closedBorderWidth: '0',
		closedPadding: '4px 0 4px var(--padding-inline)',
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
})

declare module '@expressive-code/core' {
	export interface StyleOverrides {
		collapsibleSections: Partial<typeof collapsibleSectionsStyleSettings.defaultSettings>
	}
}

export function getCollapsibleSectionsBaseStyles(theme: ExpressiveCodeTheme, coreStyles: ResolvedCoreStyles, styleOverrides: Partial<StyleOverrides> | undefined) {
	const styles = collapsibleSectionsStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides,
	})
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

				font-family: ${styles.closedFontFamily};
				font-size: ${styles.closedFontSize};
				line-height: ${styles.closedLineHeight};
				user-select: none;
				-webkit-user-select: none;

				cursor: pointer;
				color: ${styles.closedTextColor};
				background-color: ${styles.closedBackgroundColor};
				--border-color: ${styles.closedBorderColor};
				--border-width: ${styles.closedBorderWidth};
				box-shadow: inset 0 calc(-1 * var(--border-width)) var(--border-color), inset 0 var(--border-width) var(--border-color);
				padding: ${styles.closedPadding};
				margin: ${styles.closedMargin};
			}

			&[open] {
				/* hide the <summary> when the lines are displayed */
				& summary {
					display: none;
				}

				background-color: ${styles.openBackgroundColor};
				--border-color: ${styles.openBorderColor};
				--border-width: ${styles.openBorderWidth};
				box-shadow: inset 0 calc(-1 * var(--border-width)) var(--border-color), inset 0 var(--border-width) var(--border-color);
				padding-inline: ${styles.openPadding};
				margin-inline: ${styles.openMargin};
			}
		}
	`

	return result
}
