import { lighten, ensureColorContrastOnBackground } from '../helpers/color-transforms'
import { ResolverContext } from '../common/plugin'
import { PluginStyleSettings } from '../common/plugin-style-settings'
import { UnresolvedStyleSettings, codeLineClass } from '../common/style-settings'

export interface CoreStyleSettings {
	/**
	 * Border radius of code blocks.
	 * @default '0.3rem'
	 */
	borderRadius: string
	/**
	 * Border width of code blocks.
	 * @default '1.5px'
	 */
	borderWidth: string
	/**
	 * Border color of code blocks.
	 * @default
	 * ({ theme }) => theme.colors['titleBar.border'] || lighten(theme.colors['editor.background'], theme.type === 'dark' ? 0.5 : -0.15) || 'transparent'
	 */
	borderColor: string
	/**
	 * Font family of code content.
	 * @default "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
	 */
	codeFontFamily: string
	/**
	 * Font size of code content.
	 * @default '0.85rem'
	 */
	codeFontSize: string
	/**
	 * Font weight of code content.
	 * @default '400'
	 */
	codeFontWeight: string
	/**
	 * Font line height of code content.
	 * @default '1.65'
	 */
	codeLineHeight: string
	/**
	 * Block-level padding (= top and bottom padding in horizontal writing mode)
	 * around the code content inside code blocks.
	 * @default '1rem'
	 */
	codePaddingBlock: string
	/**
	 * Inline-level padding (= left and right padding in horizontal writing mode)
	 * around the code content inside code blocks.
	 * @default '1.35rem'
	 */
	codePaddingInline: string
	/**
	 * Background color of code blocks.
	 * @default
	 * ({ theme }) => theme.colors['editor.background']
	 */
	codeBackground: string
	/**
	 * Foreground color of code, unless overwritten by syntax highlighting.
	 * @default
	 * ({ theme }) => theme.colors['editor.foreground']
	 */
	codeForeground: string
	/**
	 * Background color of selected code, unless selection color customization is disabled
	 * by the option `useThemedSelectionColors`.
	 * @default
	 * ({ theme }) => theme.colors['editor.selectionBackground']
	 */
	codeSelectionBackground: string
	/**
	 * Font family of UI elements.
	 * @default "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
	 */
	uiFontFamily: string
	/**
	 * Font size of UI elements.
	 * @default '0.9rem'
	 */
	uiFontSize: string
	/**
	 * Font weight of UI elements.
	 * @default '400'
	 */
	uiFontWeight: string
	/**
	 * Font line height of UI elements.
	 * @default '1.65'
	 */
	uiLineHeight: string
	/**
	 * Block-level padding (= top and bottom padding in horizontal writing mode)
	 * of UI elements like tabs, buttons etc.
	 * @default '0.25rem'
	 */
	uiPaddingBlock: string
	/**
	 * Inline-level padding (= left and right padding in horizontal writing mode)
	 * of UI elements like tabs, buttons etc.
	 * @default '1rem'
	 */
	uiPaddingInline: string
	/**
	 * Background color of selected UI elements, unless selection color customization is disabled
	 * by the option `useThemedSelectionColors`.
	 * @default
	 * ({ theme }) => theme.colors['menu.selectionBackground']
	 */
	uiSelectionBackground: string
	/**
	 * Foreground color of selected UI elements, unless selection color customization is disabled
	 * by the option `useThemedSelectionColors`.
	 * @default
	 * ({ theme }) => theme.colors['menu.selectionForeground']
	 */
	uiSelectionForeground: string
	/**
	 * Color of the focus border around focused elements.
	 * @default
	 * ({ theme }) => theme.colors['focusBorder']
	 */
	focusBorder: string
	/**
	 * Color of the scrollbar thumb, unless scrollbar color customization is disabled
	 * by the option `useThemedScrollbars`.
	 * @default
	 * ({ theme }) => theme.colors['scrollbarSlider.background']
	 */
	scrollbarThumbColor: string
	/**
	 * Color of the scrollbar thumb when hovered, unless scrollbar color customization is disabled
	 * by the option `useThemedScrollbars`.
	 * @default
	 * ({ theme }) => theme.colors['scrollbarSlider.hoverBackground']
	 */
	scrollbarThumbHoverColor: string
}

export const coreStyleSettings = new PluginStyleSettings({
	defaultValues: {
		// Outer container
		borderRadius: '0.3rem',
		borderWidth: '1.5px',
		borderColor: ({ theme }) => theme.colors['titleBar.border'] || lighten(theme.colors['editor.background'], theme.type === 'dark' ? 0.5 : -0.15) || 'transparent',
		// Code editor content
		codeFontFamily: minifyFontFamily(`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`),
		codeFontSize: '0.85rem',
		codeFontWeight: '400',
		codeLineHeight: '1.65',
		codePaddingBlock: '1rem',
		codePaddingInline: '1.35rem',
		codeBackground: ({ theme }) => theme.colors['editor.background'],
		codeForeground: ({ theme }) => theme.colors['editor.foreground'],
		codeSelectionBackground: ({ theme }) => theme.colors['editor.selectionBackground'],
		// UI elements
		uiFontFamily: minifyFontFamily(
			`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`
		),
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
	} satisfies UnresolvedStyleSettings,
})

export function getCoreBaseStyles({
	cssVar,
	useThemedScrollbars,
	useThemedSelectionColors,
}: {
	cssVar: ResolverContext['cssVar']
	useThemedScrollbars: boolean
	useThemedSelectionColors: boolean
}) {
	const ifThemedScrollbars = (css: string) => (useThemedScrollbars ? css : '')
	const ifThemedSelectionColors = (css: string) => (useThemedSelectionColors ? css : '')

	return `
		font-family: ${cssVar('uiFontFamily')};
		font-size: ${cssVar('uiFontSize')};
		line-height: ${cssVar('uiLineHeight')};
		text-size-adjust: none;
		-webkit-text-size-adjust: none;

		*:not(path) {
			all: revert;
			box-sizing: border-box;
		}

		${ifThemedSelectionColors(`::selection {
			background: ${cssVar('uiSelectionBackground')};
			color: ${cssVar('uiSelectionForeground')};
		}`)}

		pre {
			display: flex;
			margin: 0;
			padding: 0;
			border: ${cssVar('borderWidth')} solid ${cssVar('borderColor')};
			border-radius: calc(${cssVar('borderRadius')} + ${cssVar('borderWidth')});
			background: ${cssVar('codeBackground')};

			&:focus-visible {
				outline: 3px solid ${cssVar('focusBorder')};
				outline-offset: -3px;
			}

			& > code {
				all: unset;
				display: block;
				flex: 1 0 100%;

				padding: ${cssVar('codePaddingBlock')} 0;
				color: ${cssVar('codeForeground')};

				font-family: ${cssVar('codeFontFamily')};
				font-size: ${cssVar('codeFontSize')};
				line-height: ${cssVar('codeLineHeight')};
			}

			${ifThemedSelectionColors(`::selection {
				background: ${cssVar('codeSelectionBackground')};
				color: inherit;
			}`)}

			/* Show horizontal scrollbar if required */
			overflow-x: auto;

			${ifThemedScrollbars(`
			&::-webkit-scrollbar,
			&::-webkit-scrollbar-track {
				background-color: inherit;
				border-radius: calc(${cssVar('borderRadius')} + ${cssVar('borderWidth')});
				border-top-left-radius: 0;
				border-top-right-radius: 0;
			}
			&::-webkit-scrollbar-thumb {
				background-color: ${cssVar('scrollbarThumbColor')};
				border: 4px solid transparent;
				background-clip: content-box;
				border-radius: 10px;
			}
			&::-webkit-scrollbar-thumb:hover {
				background-color: ${cssVar('scrollbarThumbHoverColor')};
			}
			`)}
		}

		/* Code lines */
		.${codeLineClass} {
			padding-inline: ${cssVar('codePaddingInline')};
			padding-inline-end: calc(2rem + ${cssVar('codePaddingInline')});

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

export function getCoreThemeStyles(styleVariantIndex: number) {
	return `
		/* Theme-dependent styles for InlineStyleAnnotation */
		.${codeLineClass} span[style^='--']:not([class]) {
			color: var(--${styleVariantIndex}, inherit);
			font-style: var(--${styleVariantIndex}fs, inherit);
			font-weight: var(--${styleVariantIndex}fw, inherit);
			text-decoration: var(--${styleVariantIndex}td, inherit);
		}
	`
}

function minifyFontFamily(fontFamily: string) {
	return fontFamily
		.split(',')
		.map((font) => font.trim())
		.join(',')
}
