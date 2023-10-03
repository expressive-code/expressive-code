import { StyleSettings, StyleOverrides, StyleVariant, ExpressiveCodeTheme, ResolvedCoreStyles, codeLineClass, toHexColor } from '@expressive-code/core'
import { MarkerType } from './marker-types'

export interface TextMarkersStyleSettings {
	lineMarkerAccentMargin: string
	lineMarkerAccentWidth: string
	lineDiffIndicatorMarginLeft: string
	inlineMarkerBorderWidth: string
	inlineMarkerBorderRadius: string
	inlineMarkerPadding: string
	markHue: string
	insHue: string
	delHue: string
	defaultChroma: string
	defaultLuminance: string
	backgroundOpacity: string
	borderLuminance: string
	borderOpacity: string
	indicatorLuminance: string
	indicatorOpacity: string
	insDiffIndicatorContent: string
	delDiffIndicatorContent: string
	markBackground: string
	markBorderColor: string
	insBackground: string
	insBorderColor: string
	insDiffIndicatorColor: string
	delBackground: string
	delBorderColor: string
	delDiffIndicatorColor: string
}

export const textMarkersStyleSettings = new StyleSettings<TextMarkersStyleSettings>({
	styleOverridesSubpath: 'textMarkers',
	defaultSettings: {
		lineMarkerAccentMargin: '0rem',
		lineMarkerAccentWidth: '0.15rem',
		lineDiffIndicatorMarginLeft: '0.5rem',
		inlineMarkerBorderWidth: '1.5px',
		inlineMarkerBorderRadius: '0.2rem',
		inlineMarkerPadding: '0.15rem',
		// Define base colors for all markers in the LCH color space,
		// which leads to consistent perceived brightness independent of hue
		markHue: '284',
		insHue: '136',
		delHue: '33',
		defaultChroma: '40',
		defaultLuminance: ['32%', '75%'],
		backgroundOpacity: '50%',
		borderLuminance: '48%',
		borderOpacity: '81.6%',
		indicatorLuminance: ['67%', '40%'],
		indicatorOpacity: '81.6%',
		// You can use these to override the diff indicator content
		insDiffIndicatorContent: "'+'",
		delDiffIndicatorContent: "'-'",
		// The settings below will be calculated by setDefaults()
		markBackground: '',
		markBorderColor: '',
		insBackground: '',
		insBorderColor: '',
		insDiffIndicatorColor: '',
		delBackground: '',
		delBorderColor: '',
		delDiffIndicatorColor: '',
	},
})

declare module '@expressive-code/core' {
	export interface StyleOverrides {
		textMarkers: Partial<typeof textMarkersStyleSettings.defaultSettings>
	}
}

setDefaults('markHue', 'markBackground', 'markBorderColor')
setDefaults('insHue', 'insBackground', 'insBorderColor', 'insDiffIndicatorColor')
setDefaults('delHue', 'delBackground', 'delBorderColor', 'delDiffIndicatorColor')

export function getTextMarkersBaseStyles(styleVariants: StyleVariant[]) {
	// TODO: Support multiple style variants
	const variant = styleVariants[0]
	const styles = textMarkersStyleSettings.resolve(variant)
	const result = `
		.${codeLineClass} {
			/* Support line-level mark/ins/del */
			&.mark {
				--line-marker-bg-color: ${styles.markBackground};
				--line-marker-border-color: ${styles.markBorderColor};
			}
			&.ins {
				--line-marker-bg-color: ${styles.insBackground};
				--line-marker-border-color: ${styles.insBorderColor};
				&::before {
					content: ${styles.insDiffIndicatorContent};
					color: ${styles.insDiffIndicatorColor};
				}
			}
			&.del {
				--line-marker-bg-color: ${styles.delBackground};
				--line-marker-border-color: ${styles.delBorderColor};
				&::before {
					content: ${styles.delDiffIndicatorContent};
					color: ${styles.delDiffIndicatorColor};
				}
			}
			&.mark,
			&.ins,
			&.del {
				--accent-margin: ${styles.lineMarkerAccentMargin};
				--accent-width: ${styles.lineMarkerAccentWidth};
				position: relative;
				background: var(--line-marker-bg-color);
				margin-inline-start: var(--accent-margin);
				border-inline-start: var(--accent-width) solid var(--line-marker-border-color);
				padding-inline-start: calc(${variant.coreStyles.codePaddingInline} - var(--accent-margin) - var(--accent-width)) !important;
				&::before {
					position: absolute;
					left: ${styles.lineDiffIndicatorMarginLeft};
				}
			}

			/* Support inline mark/ins/del */
			& mark {
				--inline-marker-bg-color: ${styles.markBackground};
				--inline-marker-border-color: ${styles.markBorderColor};
			}
			& ins {
				--inline-marker-bg-color: ${styles.insBackground};
				--inline-marker-border-color: ${styles.insBorderColor};
			}
			& del {
				--inline-marker-bg-color: ${styles.delBackground};
				--inline-marker-border-color: ${styles.delBorderColor};
			}
			& mark,
			& ins,
			& del {
				all: unset;
				display: inline-block;
				position: relative;
				--border: ${styles.inlineMarkerBorderWidth};
				--border-l: var(--border);
				--border-r: var(--border);
				--radius-l: ${styles.inlineMarkerBorderRadius};
				--radius-r: ${styles.inlineMarkerBorderRadius};
				margin-inline: 0.025rem;
				padding-inline: ${styles.inlineMarkerPadding};
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
					position: absolute;
					pointer-events: none;
					display: inline-block;
					inset: 0;
					border-radius: var(--radius-l) var(--radius-r) var(--radius-r) var(--radius-l);
					border: var(--border) solid var(--inline-marker-border-color);
					border-inline-width: var(--border-l) var(--border-r);
				}
			}
		}
	`

	return result
}

/**
 * Attempts to get background color values per marker type.
 * These colors are used for calculating contrast ratios.
 *
 * Usually, these are either the colors defined in `textMarkersStyleSettings`,
 * or style overrides provided by the user.
 *
 * One notable exception is that if non-color values (e.g. CSS variables)
 * were provided, the default colors will be returned instead. This is because
 * we can't reliably determine the actual color values from CSS variables.
 */
export function getMarkerTypeColorsForContrastCalculation({
	theme,
	coreStyles,
	styleOverrides,
}: {
	theme: ExpressiveCodeTheme
	coreStyles: ResolvedCoreStyles
	styleOverrides: Partial<StyleOverrides> | undefined
}) {
	const textMarkersStyles = textMarkersStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides,
	})
	const defaultTextMarkersStyles = textMarkersStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides: undefined,
	})
	const colorOrDefault = (input: string, defaultColor: string) => (input[0] === '#' ? input : defaultColor)
	const result: { [K in MarkerType]: string } = {
		mark: colorOrDefault(textMarkersStyles.markBackground, defaultTextMarkersStyles.markBackground),
		ins: colorOrDefault(textMarkersStyles.insBackground, defaultTextMarkersStyles.insBackground),
		del: colorOrDefault(textMarkersStyles.delBackground, defaultTextMarkersStyles.delBackground),
	}
	return result
}

type StyleSettingName = keyof typeof textMarkersStyleSettings.defaultSettings

function setDefaults(hue: StyleSettingName, bg: StyleSettingName, border: StyleSettingName, indicator?: StyleSettingName) {
	const lch = (l: string, c: string, h: string, a: string) => toHexColor(`lch(${l} ${c} ${h} / ${a})`)
	textMarkersStyleSettings.defaultSettings[bg] = ({ resolveSetting: r }) => lch(r('defaultLuminance'), r('defaultChroma'), r(hue), r('backgroundOpacity'))
	textMarkersStyleSettings.defaultSettings[border] = ({ resolveSetting: r }) => lch(r('borderLuminance'), r('defaultChroma'), r(hue), r('borderOpacity'))
	if (indicator) textMarkersStyleSettings.defaultSettings[indicator] = ({ resolveSetting: r }) => lch(r('indicatorLuminance'), r('defaultChroma'), r(hue), r('indicatorOpacity'))
}
