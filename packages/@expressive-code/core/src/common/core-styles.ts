import { lighten, ensureColorContrastOnBackground } from '../helpers/color-transforms'
import { ResolvedStyleSettings, StyleSettings, UnresolvedCoreStyleSettings } from '../helpers/style-settings'
import { ExpressiveCodeTheme } from './theme'

export type CoreStyleSettings =
	| 'borderRadius'
	| 'borderWidth'
	| 'borderColor'
	| 'codeFontFamily'
	| 'codeFontSize'
	| 'codeFontWeight'
	| 'codeLineHeight'
	| 'codePaddingBlock'
	| 'codePaddingInline'
	| 'codeBackground'
	| 'codeForeground'
	| 'codeSelectionBackground'
	| 'uiFontFamily'
	| 'uiFontSize'
	| 'uiFontWeight'
	| 'uiLineHeight'
	| 'uiPaddingBlock'
	| 'uiPaddingInline'
	| 'uiSelectionBackground'
	| 'uiSelectionForeground'
	| 'focusBorder'
	| 'scrollbarThumbColor'
	| 'scrollbarThumbHoverColor'

export const coreStyleSettings = new StyleSettings<CoreStyleSettings>({
	// Outer container
	borderRadius: '0.3rem',
	borderWidth: '1.5px',
	borderColor: ({ theme }) => lighten(theme.colors['editor.background'], theme.type === 'dark' ? 0.5 : -0.15) || 'transparent',
	// Code editor content
	codeFontFamily: [
		`'IBM Plex Mono'`,
		`Consolas`,
		`'Andale Mono WT'`,
		`'Andale Mono'`,
		`'Lucida Console'`,
		`'Lucida Sans Typewriter'`,
		`'DejaVu Sans Mono'`,
		`'Bitstream Vera Sans Mono'`,
		`'Liberation Mono'`,
		`'Nimbus Mono L'`,
		`Monaco`,
		`'Courier New'`,
		`Courier`,
		`monospace`,
	].join(','),
	codeFontSize: '0.85rem',
	codeFontWeight: '400',
	codeLineHeight: '1.65',
	codePaddingBlock: '1rem',
	codePaddingInline: '1.35rem',
	codeBackground: ({ theme }) => theme.colors['editor.background'],
	codeForeground: ({ theme }) => theme.colors['editor.foreground'],
	codeSelectionBackground: ({ theme }) => theme.colors['editor.selectionBackground'],
	// UI elements
	uiFontFamily: ['system-ui', `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Helvetica`, `Arial`, `sans-serif`, `'Apple Color Emoji'`, `'Segoe UI Emoji'`].join(','),
	uiFontSize: '0.9rem',
	uiFontWeight: '400',
	uiLineHeight: '1.65',
	uiPaddingBlock: '0.25rem',
	uiPaddingInline: '1rem',
	uiSelectionBackground: ({ theme }) => theme.colors['menu.selectionBackground'],
	uiSelectionForeground: ({ theme }) => theme.colors['menu.selectionForeground'],
	// Special colors
	focusBorder: ({ theme }) => theme.colors['focusBorder'],
	scrollbarThumbColor: ({ theme, resolveSetting }) => ensureColorContrastOnBackground(theme.colors['scrollbarSlider.background'], resolveSetting('codeBackground'), 1, 2),
	scrollbarThumbHoverColor: ({ theme, resolveSetting }) =>
		ensureColorContrastOnBackground(theme.colors['scrollbarSlider.hoverBackground'], resolveSetting('codeBackground'), 2.5, 3.5),
} satisfies UnresolvedCoreStyleSettings<CoreStyleSettings>)

export type ResolvedCoreStyles = ResolvedStyleSettings<CoreStyleSettings>

export const codeLineClass = 'ec-line'

export function getCoreBaseStyles(options: { theme: ExpressiveCodeTheme; coreStyles: ResolvedCoreStyles; useThemedScrollbars: boolean; useThemedSelectionColors: boolean }) {
	const { coreStyles } = options
	const ifThemedScrollbars = (css: string) => (options.useThemedScrollbars ? css : '')
	const ifThemedSelectionColors = (css: string) => (options.useThemedSelectionColors ? css : '')

	return `
		font-family: ${coreStyles.uiFontFamily};
		font-size: ${coreStyles.uiFontSize};
		line-height: ${coreStyles.uiLineHeight};
		text-size-adjust: none;
		-webkit-text-size-adjust: none;

		* {
			all: revert;
			box-sizing: border-box;
		}

		${ifThemedSelectionColors(`::selection {
			background: ${coreStyles.uiSelectionBackground};
			color: ${coreStyles.uiSelectionForeground};
		}`)}

		pre {
			display: flex;
			margin: 0;
			padding: 0;
			border: ${coreStyles.borderWidth} solid ${coreStyles.borderColor};
			border-radius: calc(${coreStyles.borderRadius} + ${coreStyles.borderWidth});
			background: ${coreStyles.codeBackground};
			background-clip: padding-box;

			&:focus-visible {
				outline: 3px solid ${coreStyles.focusBorder};
				outline-offset: -3px;
			}

			& > code {
				all: unset;
				display: block;
				flex: 1 0 100%;

				padding: ${coreStyles.codePaddingBlock} 0;
				color: ${coreStyles.codeForeground};

				font-family: ${coreStyles.codeFontFamily};
				font-size: ${coreStyles.codeFontSize};
				line-height: ${coreStyles.codeLineHeight};
				--padding-inline: ${coreStyles.codePaddingInline};
			}

			${ifThemedSelectionColors(`::selection {
				background: ${coreStyles.codeSelectionBackground};
			}`)}

			/* Show horizontal scrollbar if required */
			overflow-x: auto;

			${ifThemedScrollbars(`
			&::-webkit-scrollbar,
			&::-webkit-scrollbar-track {
				background-color: inherit;
				border-radius: calc(${coreStyles.borderRadius} + ${coreStyles.borderWidth});
				border-top-left-radius: 0;
				border-top-right-radius: 0;
			}
			&::-webkit-scrollbar-thumb {
				background-color: ${coreStyles.scrollbarThumbColor};
				border: 4px solid transparent;
				background-clip: content-box;
				border-radius: 10px;
			}
			&::-webkit-scrollbar-thumb:hover {
				background-color: ${coreStyles.scrollbarThumbHoverColor};
			}
			`)}
		}

		/* Code lines */
		.${codeLineClass} {
			--accent-margin: 0rem;
			min-width: calc(100% - var(--accent-margin));
			padding-inline: var(--padding-inline);
			padding-inline-end: calc(2rem + var(--padding-inline));

			/* RTL support: Code is always LTR */
			direction: ltr;
			unicode-bidi: isolate;
		}

		/* Common style to hide elements from screen readers */
		.sr-only {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border-width: 0;							
		}
	`
}
