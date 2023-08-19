import { StyleSettings, ExpressiveCodeTheme, ResolvedCoreStyles, setAlpha } from '@expressive-code/core'

export const collapsibleSectionClass = 'ec-section'

export const collapsibleSectionsStyleSettings = new StyleSettings({
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
})

export function getCollapsibleSectionsBaseStyles(
	theme: ExpressiveCodeTheme,
	coreStyles: ResolvedCoreStyles,
	styleOverrides: Partial<typeof collapsibleSectionsStyleSettings.defaultSettings>
) {
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
				box-shadow:
					inset 0 calc(-1 * var(--border-width)) var(--border-color),
					inset 0 var(--border-width) var(--border-color);
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
				box-shadow:
					inset 0 calc(-1 * var(--border-width)) var(--border-color),
					inset 0 var(--border-width) var(--border-color);
				padding-inline: ${styles.openPadding};
				margin-inline: ${styles.openMargin};
			}
		}
	`

	return result
}
