import { PluginStyleSettings, codeLineClass, toHexColor, StyleSettingPath, ResolverContext, StyleResolverFn } from '@expressive-code/core'
import { MarkerType } from './marker-types'

export interface TextMarkersStyleSettings {
	/**
	 * The margin between the code block border and the line marker accent bar
	 * displayed on the left side of a full-line text marker.
	 * @default '0rem'
	 */
	lineMarkerAccentMargin: string
	/**
	 * The width of the line marker accent bar. This is the vertical border-like bar
	 * displayed on the left side of a full-line text marker.
	 * @default '0.15rem'
	 */
	lineMarkerAccentWidth: string
	/**
	 * The inline padding (= left & right padding in horizontal writing mode)
	 * around line marker labels.
	 *
	 * @note If your line marker labels overlap with the code content,
	 * consider increasing the root style setting `codePaddingInline`.
	 *
	 * @default '0.2rem'
	 */
	lineMarkerLabelPaddingInline: string
	/**
	 * The text color of the optional labels that can be displayed on the left side
	 * of a full-line text marker.
	 * @default 'white'
	 */
	lineMarkerLabelColor: string
	/**
	 * The margin between the code block border and the diff indicator (e.g. `+` or `-`)
	 * displayed on the left side of a full-line text marker.
	 * @default '0.5rem'
	 */
	lineDiffIndicatorMarginLeft: string
	/**
	 * The width of the border around inline text markers, rendered in a way
	 * that does not cause marked code to shift.
	 * @default '1.5px'
	 */
	inlineMarkerBorderWidth: string
	/**
	 * The border radius of inline text markers.
	 * @default '0.2rem'
	 */
	inlineMarkerBorderRadius: string
	/**
	 * The inline padding of inline text markers. Keep this low to prevent marked code
	 * from shifting too much compared to the original text.
	 * @default '0.15rem'
	 */
	inlineMarkerPadding: string
	/**
	 * The LCH hue to be used for marked text (text marker type `mark`).
	 * @default '284' (a blue hue)
	 */
	markHue: string
	/**
	 * The LCH hue to be used for inserted text (text marker type `ins`).
	 * @default '136' (a green hue)
	 */
	insHue: string
	/**
	 * The LCH hue to be used for deleted text (text marker type `del`).
	 * @default '33' (a red hue)
	 */
	delHue: string
	/**
	 * The LCH chroma to be used for all text marker types.
	 *
	 * The chroma value defines the saturation of the color. Higher values lead to
	 * more saturated colors, lower values lead to less saturated colors.
	 *
	 * @default '40'
	 */
	defaultChroma: string
	/**
	 * The LCH luminance to be used for all text marker types.
	 * @default
	 * ['32%', '75%'] // 32% for dark themes, 75% for light themes
	 */
	defaultLuminance: string
	/**
	 * The opacity of the background color of all text marker types.
	 * @default '50%'
	 */
	backgroundOpacity: string
	/**
	 * The LCH luminance to be used for the border color of all text marker types.
	 * @default '48%'
	 */
	borderLuminance: string
	/**
	 * The opacity of the border color of all text marker types.
	 * @default '81.6%'
	 */
	borderOpacity: string
	/**
	 * The LCH luminance to be used for the diff indicator (e.g. `+` or `-`).
	 * @default
	 * ['67%', '40%'] // 67% for dark themes, 40% for light themes
	 */
	indicatorLuminance: string
	/**
	 * The opacity of the diff indicator (e.g. `+` or `-`).
	 * @default '81.6%'
	 */
	indicatorOpacity: string
	/**
	 * The content to be displayed inside the diff indicator of inserted lines.
	 *
	 * Note that this is used as the `content` value in a CSS pseudo-element,
	 * so you need to wrap any text in additional quotes.
	 *
	 * @default "'+'"
	 */
	insDiffIndicatorContent: string
	/**
	 * The content to be displayed inside the diff indicator of deleted lines.
	 *
	 * Note that this is used as the `content` value in a CSS pseudo-element,
	 * so you need to wrap any text in additional quotes.
	 *
	 * @default "'-'"
	 */
	delDiffIndicatorContent: string
	/**
	 * The background color of marked text (text marker type `mark`).
	 * @default
	 * lch(<defaultLuminance> <defaultChroma> <markHue> / <backgroundOpacity>)
	 */
	markBackground: string
	/**
	 * The border color of marked text (text marker type `mark`).
	 * @default
	 * lch(<borderLuminance> <defaultChroma> <markHue> / <borderOpacity>)
	 */
	markBorderColor: string
	/**
	 * The background color of inserted text (text marker type `ins`).
	 * @default
	 * lch(<defaultLuminance> <defaultChroma> <insHue> / <backgroundOpacity>)
	 */
	insBackground: string
	/**
	 * The border color of inserted text (text marker type `ins`).
	 * @default
	 * lch(<borderLuminance> <defaultChroma> <insHue> / <borderOpacity>)
	 */
	insBorderColor: string
	/**
	 * The color of the diff indicator (e.g. `+` or `-`) of inserted lines.
	 * @default
	 * lch(<indicatorLuminance> <defaultChroma> <insHue> / <indicatorOpacity>)
	 */
	insDiffIndicatorColor: string
	/**
	 * The background color of deleted text (text marker type `del`).
	 * @default
	 * lch(<defaultLuminance> <defaultChroma> <delHue> / <backgroundOpacity>)
	 */
	delBackground: string
	/**
	 * The border color of deleted text (text marker type `del`).
	 * @default
	 * lch(<borderLuminance> <defaultChroma> <delHue> / <borderOpacity>)
	 */
	delBorderColor: string
	/**
	 * The color of the diff indicator (e.g. `+` or `-`) of deleted lines.
	 * @default
	 * lch(<indicatorLuminance> <defaultChroma> <delHue> / <indicatorOpacity>)
	 */
	delDiffIndicatorColor: string
}

declare module '@expressive-code/core' {
	export interface StyleSettings {
		textMarkers: TextMarkersStyleSettings
	}
}

export const textMarkersStyleSettings = new PluginStyleSettings({
	defaultValues: {
		textMarkers: {
			lineMarkerAccentMargin: '0rem',
			lineMarkerAccentWidth: '0.15rem',
			lineMarkerLabelPaddingInline: '0.2rem',
			lineMarkerLabelColor: 'white',
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
			// The settings below will be calculated based on the settings above
			markBackground: (context) => resolveBg(context, 'textMarkers.markHue'),
			markBorderColor: (context) => resolveBorder(context, 'textMarkers.markHue'),
			insBackground: (context) => resolveBg(context, 'textMarkers.insHue'),
			insBorderColor: (context) => resolveBorder(context, 'textMarkers.insHue'),
			insDiffIndicatorColor: (context) => resolveIndicator(context, 'textMarkers.insHue'),
			delBackground: (context) => resolveBg(context, 'textMarkers.delHue'),
			delBorderColor: (context) => resolveBorder(context, 'textMarkers.delHue'),
			delDiffIndicatorColor: (context) => resolveIndicator(context, 'textMarkers.delHue'),
		},
	},
	cssVarExclusions: [
		// Exclude all settings from CSS variable output that will not be used directly in styles,
		// but instead be used to calculate other settings
		'textMarkers.markHue',
		'textMarkers.insHue',
		'textMarkers.delHue',
		'textMarkers.defaultChroma',
		'textMarkers.defaultLuminance',
		'textMarkers.backgroundOpacity',
		'textMarkers.borderLuminance',
		'textMarkers.borderOpacity',
		'textMarkers.indicatorLuminance',
		'textMarkers.indicatorOpacity',
	],
})

export function getTextMarkersBaseStyles({ cssVar }: ResolverContext) {
	const result = `
		.${codeLineClass} {
			/* Support line-level mark/ins/del */
			&.mark {
				--tmLineBgCol: ${cssVar('textMarkers.markBackground')};
				--tmLineBrdCol: ${cssVar('textMarkers.markBorderColor')};
			}
			&.ins {
				--tmLineBgCol: ${cssVar('textMarkers.insBackground')};
				--tmLineBrdCol: ${cssVar('textMarkers.insBorderColor')};
				&::before {
					content: ${cssVar('textMarkers.insDiffIndicatorContent')};
					color: ${cssVar('textMarkers.insDiffIndicatorColor')};
				}
			}
			&.del {
				--tmLineBgCol: ${cssVar('textMarkers.delBackground')};
				--tmLineBrdCol: ${cssVar('textMarkers.delBorderColor')};
				&::before {
					content: ${cssVar('textMarkers.delDiffIndicatorContent')};
					color: ${cssVar('textMarkers.delDiffIndicatorColor')};
				}
			}
			&.mark,
			&.ins,
			&.del {
				position: relative;
				background: var(--tmLineBgCol);
				min-width: calc(100% - ${cssVar('textMarkers.lineMarkerAccentMargin')});
				margin-inline-start: ${cssVar('textMarkers.lineMarkerAccentMargin')};
				border-inline-start: ${cssVar('textMarkers.lineMarkerAccentWidth')} solid var(--tmLineBrdCol);
				padding-inline-start: calc(${cssVar('codePaddingInline')} - ${cssVar('textMarkers.lineMarkerAccentMargin')} - ${cssVar('textMarkers.lineMarkerAccentWidth')}) !important;
				&::before {
					position: absolute;
					left: ${cssVar('textMarkers.lineDiffIndicatorMarginLeft')};
				}
				&[data-marker-label]::before {
					content: attr(data-marker-label);
					background: var(--tmLineBrdCol);
					left: 0;
					padding: 0 calc(${cssVar('textMarkers.lineMarkerLabelPaddingInline')} + ${cssVar('textMarkers.lineMarkerAccentWidth')}) 0 ${cssVar('textMarkers.lineMarkerLabelPaddingInline')};
					color: ${cssVar('textMarkers.lineMarkerLabelColor')};
				}
			}

			/* Support inline mark/ins/del */
			& mark {
				--tmInlineBgCol: ${cssVar('textMarkers.markBackground')};
				--tmInlineBrdCol: ${cssVar('textMarkers.markBorderColor')};
			}
			& ins {
				--tmInlineBgCol: ${cssVar('textMarkers.insBackground')};
				--tmInlineBrdCol: ${cssVar('textMarkers.insBorderColor')};
			}
			& del {
				--tmInlineBgCol: ${cssVar('textMarkers.delBackground')};
				--tmInlineBrdCol: ${cssVar('textMarkers.delBorderColor')};
			}
			& mark,
			& ins,
			& del {
				all: unset;
				display: inline-block;
				position: relative;
				--tmBrdL: ${cssVar('textMarkers.inlineMarkerBorderWidth')};
				--tmBrdR: ${cssVar('textMarkers.inlineMarkerBorderWidth')};
				--tmRadL: ${cssVar('textMarkers.inlineMarkerBorderRadius')};
				--tmRadR: ${cssVar('textMarkers.inlineMarkerBorderRadius')};
				margin-inline: 0.025rem;
				padding-inline: ${cssVar('textMarkers.inlineMarkerPadding')};
				border-radius: var(--tmRadL) var(--tmRadR) var(--tmRadR) var(--tmRadL);
				background: var(--tmInlineBgCol);
				background-clip: padding-box;

				&.open-start {
					margin-inline-start: 0;
					padding-inline-start: 0;
					--tmBrdL: 0px;
					--tmRadL: 0;
				}
				&.open-end {
					margin-inline-end: 0;
					padding-inline-end: 0;
					--tmBrdR: 0px;
					--tmRadR: 0;
				}
				&::before {
					content: '';
					position: absolute;
					pointer-events: none;
					display: inline-block;
					inset: 0;
					border-radius: var(--tmRadL) var(--tmRadR) var(--tmRadR) var(--tmRadL);
					border: ${cssVar('textMarkers.inlineMarkerBorderWidth')} solid var(--tmInlineBrdCol);
					border-inline-width: var(--tmBrdL) var(--tmBrdR);
				}
			}
		}
	`

	return result
}

export const markerBgColorPaths: { [K in MarkerType]: StyleSettingPath } = {
	mark: 'textMarkers.markBackground',
	ins: 'textMarkers.insBackground',
	del: 'textMarkers.delBackground',
}

function resolveBg({ resolveSetting: r }: Parameters<StyleResolverFn>[0], hue: StyleSettingPath) {
	return toHexColor(`lch(${r('textMarkers.defaultLuminance')} ${r('textMarkers.defaultChroma')} ${r(hue)} / ${r('textMarkers.backgroundOpacity')})`)
}

function resolveBorder({ resolveSetting: r }: Parameters<StyleResolverFn>[0], hue: StyleSettingPath) {
	return toHexColor(`lch(${r('textMarkers.borderLuminance')} ${r('textMarkers.defaultChroma')} ${r(hue)} / ${r('textMarkers.borderOpacity')})`)
}

function resolveIndicator({ resolveSetting: r }: Parameters<StyleResolverFn>[0], hue: StyleSettingPath) {
	return toHexColor(`lch(${r('textMarkers.indicatorLuminance')} ${r('textMarkers.defaultChroma')} ${r(hue)} / ${r('textMarkers.indicatorOpacity')})`)
}
