import { StyleSettings, ExpressiveCodeTheme, ResolvedCoreStyles, codeLineClass } from '@expressive-code/core'

export const textMarkersStyleSettings = new StyleSettings({
	lineMarkerAccentMargin: '0rem',
	lineMarkerAccentWidth: '0.15rem',
	lineDiffIndicatorMarginLeft: '0.5rem',
	inlineMarkerBorderWidth: '1.5px',
	inlineMarkerBorderRadius: '0.2rem',
	inlineMarkerPadding: '0.15rem',
	markBackground: ['#36468880', '#AEB7FE80'],
	markBorderColor: '#626DB4D0',
	insBackground: ['#1F561C80', '#A6C49F80'],
	insBorderColor: '#487E41D0',
	insDiffIndicatorColor: ['#86AF7ED0', '#276C26D0'],
	insDiffIndicatorContent: "'+'",
	delBackground: ['#832F2980', '#E8AEA580'],
	delBorderColor: '#B1574ED0',
	delDiffIndicatorColor: ['#D5948AD0', '#A53B34D0'],
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
				--line-marker-border-color: ${textMarkersStyles.markBorderColor};
			}
			&.ins {
				--line-marker-bg-color: ${textMarkersStyles.insBackground};
				--line-marker-border-color: ${textMarkersStyles.insBorderColor};
				&::before {
					content: ${textMarkersStyles.insDiffIndicatorContent};
					color: ${textMarkersStyles.insDiffIndicatorColor};
				}
			}
			&.del {
				--line-marker-bg-color: ${textMarkersStyles.delBackground};
				--line-marker-border-color: ${textMarkersStyles.delBorderColor};
				&::before {
					content: ${textMarkersStyles.delDiffIndicatorContent};
					color: ${textMarkersStyles.delDiffIndicatorColor};
				}
			}
			&.mark,
			&.ins,
			&.del {
				--accent-margin: ${textMarkersStyles.lineMarkerAccentMargin};
				--accent-width: ${textMarkersStyles.lineMarkerAccentWidth};
				position: relative;
				background: var(--line-marker-bg-color);
				margin-inline-start: var(--accent-margin);
				border-inline-start: var(--accent-width) solid var(--line-marker-border-color);
				padding-inline-start: calc(
					${coreStyles.codePaddingInline} - var(--accent-margin) - var(--accent-width)
				) !important;
				&::before {
					position: absolute;
					left: ${textMarkersStyles.lineDiffIndicatorMarginLeft};
				}
			}

			/* Support inline mark/ins/del */
			& mark {
				--inline-marker-bg-color: ${textMarkersStyles.markBackground};
				--inline-marker-border-color: ${textMarkersStyles.markBorderColor};
			}
			& ins {
				--inline-marker-bg-color: ${textMarkersStyles.insBackground};
				--inline-marker-border-color: ${textMarkersStyles.insBorderColor};
			}
			& del {
				--inline-marker-bg-color: ${textMarkersStyles.delBackground};
				--inline-marker-border-color: ${textMarkersStyles.delBorderColor};
			}
			& mark,
			& ins,
			& del {
				all: unset;
				display: inline-block;
				position: relative;
				--border: ${textMarkersStyles.inlineMarkerBorderWidth};
				--border-l: var(--border);
				--border-r: var(--border);
				--radius-l: ${textMarkersStyles.inlineMarkerBorderRadius};
				--radius-r: ${textMarkersStyles.inlineMarkerBorderRadius};
				margin-inline: 0.025rem;
				padding-inline: ${textMarkersStyles.inlineMarkerPadding};
				border-radius: var(--radius-l) var(--radius-r) var(--radius-r) var(--radius-l);
				background: var(--inline-marker-bg-color);
				background-clip: padding-box;

				&.open-start {
					margin-inline-start: 0;
					padding-inline-start: 0;
					--border-l: 0px;
					--radius-l: 0;
				}
				&.open-end {
					margin-inline-end: 0;
					padding-inline-end: 0;
					--border-r: 0px;
					--radius-r: 0;
				}
				&::before {
					content: '';
					display: inline-block;
					position: absolute;
					inset: 0;
					border-radius: var(--radius-l) var(--radius-r) var(--radius-r) var(--radius-l);
					border: var(--border) solid var(--inline-marker-border-color);
					border-inline-width: var(--border-l) var(--border-r);
				}
			}
		}
	`

	return styles
}
