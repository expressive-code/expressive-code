import { ResolvedStyleSettings, StyleSettings } from '../helpers/style-settings'
import { ExpressiveCodeTheme } from './theme'

export const coreStyleSettings = new StyleSettings({
	borderRadius: '0.3rem',
	borderWidth: '2px',
	borderColor: ({ theme }) => theme.colors['editorGroup.border'],
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
	codeFontSize: '0.85em',
	codeFontWeight: '400',
	codeLineHeight: '1.65',
	codePaddingBlock: '1rem',
	codePaddingInline: '1.35rem',
	codeBackground: ({ theme }) => theme.colors['editor.background'],
	codeForeground: ({ theme }) => theme.colors['editor.foreground'],
	uiFontFamily: ['system-ui', `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Helvetica`, `Arial`, `sans-serif`, `'Apple Color Emoji'`, `'Segoe UI Emoji'`].join(','),
	uiFontSize: '0.9rem',
	uiFontWeight: '400',
	uiLineHeight: '1.65',
	uiPaddingBlock: '0.25rem',
	uiPaddingInline: '1rem',
})

export type ResolvedCoreStyles = ResolvedStyleSettings<keyof typeof coreStyleSettings.defaultSettings>

export function getCoreBaseStyles({ theme, coreStyles }: { theme: ExpressiveCodeTheme; coreStyles: ResolvedCoreStyles }) {
	return `
		font-family: ${coreStyles.uiFontFamily};
		font-size: ${coreStyles.uiFontSize};
		line-height: ${coreStyles.uiLineHeight};

		pre {
			margin: 0;
			border: ${coreStyles.borderWidth} solid ${coreStyles.borderColor};
			border-radius: calc(${coreStyles.borderRadius} + ${coreStyles.borderWidth});
			background: none;

			&:focus-visible {
				outline: 3px solid var(--theme-accent);
				outline-offset: -3px;
			}

			& > code {
				all: unset;
				display: inline-block;
				min-width: 100%;

				border-radius: ${coreStyles.borderRadius};
				background-color: ${coreStyles.codeBackground};
				padding: ${coreStyles.codePaddingBlock} 0;
				color: ${coreStyles.codeForeground};

				font-family: ${coreStyles.codeFontFamily};
				font-size: ${coreStyles.codeFontSize};
				line-height: ${coreStyles.codeLineHeight};
				--padding-inline: ${coreStyles.codePaddingInline};

				/* Style code lines */
				& > div {
					box-sizing: border-box;
					--accent-margin: 0rem;
					min-width: calc(100% - var(--accent-margin));
					padding-inline-start: var(--padding-inline);
					padding-inline-end: calc(2 * var(--padding-inline));
				}
			}

			::selection {
				background-color: ${theme.colors['editor.selectionBackground']};
			}
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
