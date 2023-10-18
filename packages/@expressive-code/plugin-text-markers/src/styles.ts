import { PluginStyleSettings, codeLineClass, toHexColor, StyleSettingPath, ResolverContext, StyleResolverFn } from '@expressive-code/core'
import { MarkerType } from './marker-types'

// TODO: Document settings
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
				--line-marker-bg-color: ${cssVar('textMarkers.markBackground')};
				--line-marker-border-color: ${cssVar('textMarkers.markBorderColor')};
			}
			&.ins {
				--line-marker-bg-color: ${cssVar('textMarkers.insBackground')};
				--line-marker-border-color: ${cssVar('textMarkers.insBorderColor')};
				&::before {
					content: ${cssVar('textMarkers.insDiffIndicatorContent')};
					color: ${cssVar('textMarkers.insDiffIndicatorColor')};
				}
			}
			&.del {
				--line-marker-bg-color: ${cssVar('textMarkers.delBackground')};
				--line-marker-border-color: ${cssVar('textMarkers.delBorderColor')};
				&::before {
					content: ${cssVar('textMarkers.delDiffIndicatorContent')};
					color: ${cssVar('textMarkers.delDiffIndicatorColor')};
				}
			}
			&.mark,
			&.ins,
			&.del {
				--accent-margin: ${cssVar('textMarkers.lineMarkerAccentMargin')};
				--accent-width: ${cssVar('textMarkers.lineMarkerAccentWidth')};
				position: relative;
				background: var(--line-marker-bg-color);
				margin-inline-start: var(--accent-margin);
				border-inline-start: var(--accent-width) solid var(--line-marker-border-color);
				padding-inline-start: calc(${cssVar('codePaddingInline')} - var(--accent-margin) - var(--accent-width)) !important;
				&::before {
					position: absolute;
					left: ${cssVar('textMarkers.lineDiffIndicatorMarginLeft')};
				}
			}

			/* Support inline mark/ins/del */
			& mark {
				--inline-marker-bg-color: ${cssVar('textMarkers.markBackground')};
				--inline-marker-border-color: ${cssVar('textMarkers.markBorderColor')};
			}
			& ins {
				--inline-marker-bg-color: ${cssVar('textMarkers.insBackground')};
				--inline-marker-border-color: ${cssVar('textMarkers.insBorderColor')};
			}
			& del {
				--inline-marker-bg-color: ${cssVar('textMarkers.delBackground')};
				--inline-marker-border-color: ${cssVar('textMarkers.delBorderColor')};
			}
			& mark,
			& ins,
			& del {
				all: unset;
				display: inline-block;
				position: relative;
				--border: ${cssVar('textMarkers.inlineMarkerBorderWidth')};
				--border-l: var(--border);
				--border-r: var(--border);
				--radius-l: ${cssVar('textMarkers.inlineMarkerBorderRadius')};
				--radius-r: ${cssVar('textMarkers.inlineMarkerBorderRadius')};
				margin-inline: 0.025rem;
				padding-inline: ${cssVar('textMarkers.inlineMarkerPadding')};
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
