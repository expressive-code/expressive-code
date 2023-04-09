import { StyleSettings, ExpressiveCodeTheme, ResolvedCoreStyles, codeLineClass, setAlpha, mix } from '@expressive-code/core'

export const textMarkersStyleSettings = new StyleSettings({
	lineAccentMargin: '0rem',
	lineAccentWidth: '0.15rem',
	diffIndicatorMarginLeft: '0.5rem',
	markBackground: ({ theme }) => theme.colors['editor.selectionBackground'],
	markBorder: ({ theme }) => setAlpha(theme.colors['editor.selectionBackground'], 0.75),
	insBackground: ({ theme }) => theme.colors['diffEditor.insertedLineBackground'],
	insBorder: ({ theme }) => theme.colors['diffEditor.insertedTextBorder'] || setAlpha(theme.colors['diffEditor.insertedLineBackground'], 0.75),
	insDiffIndicatorColor: ({ theme, coreStyles }) =>
		theme.colors['diffEditor.insertedTextForeground'] || setAlpha(mix(theme.colors['diffEditor.insertedLineBackground'], coreStyles.codeForeground, 0.25), 0.75),
	insDiffIndicatorContent: "'+'",
	delBackground: ({ theme }) => theme.colors['diffEditor.removedLineBackground'],
	delBorder: ({ theme }) => theme.colors['diffEditor.removedTextBorder'] || setAlpha(theme.colors['diffEditor.removedLineBackground'], 0.75),
	delDiffIndicatorColor: ({ theme, coreStyles }) =>
		theme.colors['diffEditor.removedTextForeground'] || setAlpha(mix(theme.colors['diffEditor.removedLineBackground'], coreStyles.codeForeground, 0.25), 0.75),
	delDiffIndicatorContent: "'-'",
})

export function getTextMarkersBaseStyles(theme: ExpressiveCodeTheme, coreStyles: ResolvedCoreStyles, styleOverrides: Partial<typeof textMarkersStyleSettings.defaultSettings>) {
	const textMarkersStyles = textMarkersStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides,
	})
	const styles = `
		.${codeLineClass} {
			/* Support line-level mark/ins/del */
			&.mark {
				--line-marker-bg-color: ${textMarkersStyles.markBackground};
				--line-marker-border-color: ${textMarkersStyles.markBorder};
			}
			&.ins {
				--line-marker-bg-color: ${textMarkersStyles.insBackground};
				--line-marker-border-color: ${textMarkersStyles.insBorder};
				&::before {
					content: ${textMarkersStyles.insDiffIndicatorContent};
					color: ${textMarkersStyles.insDiffIndicatorColor};
				}
			}
			&.del {
				--line-marker-bg-color: ${textMarkersStyles.delBackground};
				--line-marker-border-color: ${textMarkersStyles.delBorder};
				&::before {
					content: ${textMarkersStyles.delDiffIndicatorContent};
					color: ${textMarkersStyles.delDiffIndicatorColor};
				}
			}
			&.mark,
			&.ins,
			&.del {
				--accent-margin: ${textMarkersStyles.lineAccentMargin};
				--accent-width: ${textMarkersStyles.lineAccentWidth};
				position: relative;
				background: var(--line-marker-bg-color);
				margin-inline-start: var(--accent-margin);
				border-inline-start: var(--accent-width) solid var(--line-marker-border-color);
				padding-inline-start: calc(
					${coreStyles.codePaddingInline} - var(--accent-margin) - var(--accent-width)
				) !important;
				&::before {
					position: absolute;
					left: ${textMarkersStyles.diffIndicatorMarginLeft};
				}
			}

			/* Support inline mark/ins/del */
			& mark {
				--inline-marker-bg-color: ${textMarkersStyles.markBackground};
				--inline-marker-border-color: ${textMarkersStyles.markBorder};
			}
			& ins {
				--inline-marker-bg-color: ${textMarkersStyles.insBackground};
				--inline-marker-border-color: ${textMarkersStyles.insBorder};
			}
			& del {
				--inline-marker-bg-color: ${textMarkersStyles.delBackground};
				--inline-marker-border-color: ${textMarkersStyles.delBorder};
			}
			& mark,
			& ins,
			& del {
				all: unset;
				background: var(--inline-marker-bg-color);
				box-shadow: 0 0 0 0.05rem var(--inline-marker-bg-color),
					0 0 0 0.075rem var(--inline-marker-border-color);
				border-radius: 0.05rem;
				padding-inline: 0.05rem;
				margin-inline: 0.1rem;
			}
		}
	`

	return styles
}
