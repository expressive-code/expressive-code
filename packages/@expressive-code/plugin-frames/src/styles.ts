import { PluginStyleSettings, ResolverContext, multiplyAlpha, onBackground, setLuminance } from '@expressive-code/core'
import { PluginFramesOptions } from '.'

export interface FramesStyleSettings {
	/**
	 * The color to use for the shadow of the frame.
	 * @default
	 * ({ theme, resolveSetting }) => theme.colors['widget.shadow'] || multiplyAlpha(resolveSetting('borderColor'), 0.75)
	 */
	shadowColor: string
	/**
	 * The CSS value for the box shadow of the frame.
	 * @default
	 * ({ resolveSetting }) => `0.1rem 0.1rem 0.2rem ${resolveSetting('frames.shadowColor')}`
	 */
	frameBoxShadowCssValue: string
	/**
	 * The CSS `background` value for the active editor tab.
	 * @default
	 * ({ theme }) => theme.colors['tab.activeBackground']
	 */
	editorActiveTabBackground: string
	/**
	 * The foreground color of the active editor tab.
	 * @default
	 * ({ theme }) => theme.colors['tab.activeForeground']
	 */
	editorActiveTabForeground: string
	/**
	 * The border color of the active editor tab.
	 * @default 'transparent'
	 */
	editorActiveTabBorderColor: string
	/**
	 * The height of the indicator lines highlighting the active editor tab.
	 * These are colorful lines that appear at the top and/or bottom of the active tab.
	 *
	 * The individual line colors can be set in {@link editorActiveTabIndicatorTopColor} and
	 * {@link editorActiveTabIndicatorBottomColor}.
	 *
	 * @default
	 * ({ resolveSetting }) => resolveSetting('borderWidth')
	 */
	editorActiveTabIndicatorHeight: string
	/**
	 * The color of the indicator line displayed at the top border of the active editor tab.
	 * @default
	 * ({ theme }) => theme.colors['tab.activeBorderTop']
	 */
	editorActiveTabIndicatorTopColor: string
	/**
	 * The color of the indicator line displayed at the bottom border of the active editor tab.
	 * @default
	 * ({ theme }) => theme.colors['tab.activeBorder']
	 */
	editorActiveTabIndicatorBottomColor: string
	/**
	 * The inline margin (= left margin in horizontal writing mode) to apply inside the tab bar
	 * before the first editor tab.
	 * @default '0'
	 */
	editorTabsMarginInlineStart: string
	/**
	 * The block margin (= top margin in horizontal writing mode) to apply inside the tab bar
	 * before the editor tabs.
	 * @default '0'
	 */
	editorTabsMarginBlockStart: string
	/**
	 * The border radius to apply to the outer corners of editor tabs.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('borderRadius')
	 */
	editorTabBorderRadius: string
	/**
	 * The CSS `background` value of the editor tab bar.
	 * @default
	 * ({ theme }) => theme.colors['editorGroupHeader.tabsBackground']
	 */
	editorTabBarBackground: string
	/**
	 * The border color of the editor tab bar.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('borderColor')
	 */
	editorTabBarBorderColor: string
	/**
	 * The color of the bottom border of the editor tab bar. This is an additional border
	 * that can be used to display a line between the editor tab bar and the code contents.
	 * @default
	 * ({ theme }) => theme.colors['editorGroupHeader.tabsBorder'] || 'transparent'
	 */
	editorTabBarBorderBottomColor: string
	/**
	 * The background color of the code editor.
	 * This color is used for the "code" frame type.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('codeBackground')
	 */
	editorBackground: string
	/**
	 * The color of the three dots in the terminal title bar.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('frames.terminalTitlebarForeground')
	 */
	terminalTitlebarDotsForeground: string
	/**
	 * The opacity of the three dots in the terminal title bar.
	 * @default '0.15'
	 */
	terminalTitlebarDotsOpacity: string
	/**
	 * The background color of the terminal title bar.
	 * @default
	 * ({ theme }) => theme.colors['titleBar.activeBackground'] || theme.colors['editorGroupHeader.tabsBackground']
	 */
	terminalTitlebarBackground: string
	/**
	 * The foreground color of the terminal title bar.
	 * @default
	 * ({ theme }) => theme.colors['titleBar.activeForeground']
	 */
	terminalTitlebarForeground: string
	/**
	 * The color of the border between the terminal title bar and the terminal contents.
	 * @default
	 * ({ theme, resolveSetting }) =>
	 *   theme.colors['titleBar.border'] ||
	 *   onBackground(resolveSetting('borderColor'), theme.type === 'dark' ? '#000000bf' : '#ffffffbf')
	 */
	terminalTitlebarBorderBottom: string
	/**
	 * The background color of the terminal window.
	 * This color is used for the "terminal" frame type.
	 * @default
	 * ({ theme }) => theme.colors['terminal.background']
	 */
	terminalBackground: string
	/**
	 * The background color of the copy button.
	 * This color is modified by the state-dependent opacity values specified in
	 * {@link inlineButtonBackgroundIdleOpacity}, {@link inlineButtonBackgroundHoverOrFocusOpacity}
	 * and {@link inlineButtonBackgroundActiveOpacity}.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('frames.inlineButtonForeground')
	 */
	inlineButtonBackground: string
	/**
	 * The opacity of the copy button background when idle.
	 * @default '0'
	 */
	inlineButtonBackgroundIdleOpacity: string
	/**
	 * The opacity of the copy button background when hovered or focused.
	 * @default '0.2'
	 */
	inlineButtonBackgroundHoverOrFocusOpacity: string
	/**
	 * The opacity of the copy button background when pressed.
	 * @default '0.3'
	 */
	inlineButtonBackgroundActiveOpacity: string
	/**
	 * The foreground color of the copy button.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('codeForeground')
	 */
	inlineButtonForeground: string
	/**
	 * The border color of the copy button.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('frames.inlineButtonForeground')
	 */
	inlineButtonBorder: string
	/**
	 * The opacity of the copy button border.
	 * @default '0.4'
	 */
	inlineButtonBorderOpacity: string
	/**
	 * The background color of the tooltip shown after successfully copying the code.
	 * @default
	 * ({ theme }) => setLuminance(theme.colors['terminal.ansiGreen'] || '#0dbc79', 0.18)
	 */
	tooltipSuccessBackground: string
	/**
	 * The foreground color of the tooltip shown after successfully copying the code.
	 * @default 'white'
	 */
	tooltipSuccessForeground: string
}

declare module '@expressive-code/core' {
	export interface StyleSettings {
		frames: FramesStyleSettings
	}
}

export const framesStyleSettings = new PluginStyleSettings({
	defaultValues: {
		frames: {
			shadowColor: ({ theme, resolveSetting }) => theme.colors['widget.shadow'] || multiplyAlpha(resolveSetting('borderColor'), 0.75),
			frameBoxShadowCssValue: ({ resolveSetting }) => `0.1rem 0.1rem 0.2rem ${resolveSetting('frames.shadowColor')}`,
			editorActiveTabBackground: ({ theme }) => theme.colors['tab.activeBackground'],
			editorActiveTabForeground: ({ theme }) => theme.colors['tab.activeForeground'],
			editorActiveTabBorderColor: 'transparent',
			editorActiveTabIndicatorHeight: ({ resolveSetting }) => resolveSetting('borderWidth'),
			editorActiveTabIndicatorTopColor: ({ theme }) => theme.colors['tab.activeBorderTop'],
			editorActiveTabIndicatorBottomColor: ({ theme }) => theme.colors['tab.activeBorder'],
			editorTabsMarginInlineStart: '0',
			editorTabsMarginBlockStart: '0',
			editorTabBorderRadius: ({ resolveSetting }) => resolveSetting('borderRadius'),
			editorTabBarBackground: ({ theme }) => theme.colors['editorGroupHeader.tabsBackground'],
			editorTabBarBorderColor: ({ resolveSetting }) => resolveSetting('borderColor'),
			editorTabBarBorderBottomColor: ({ theme }) => theme.colors['editorGroupHeader.tabsBorder'] || 'transparent',
			editorBackground: ({ resolveSetting }) => resolveSetting('codeBackground'),
			terminalTitlebarDotsForeground: ({ resolveSetting }) => resolveSetting('frames.terminalTitlebarForeground'),
			terminalTitlebarDotsOpacity: '0.15',
			terminalTitlebarBackground: ({ theme }) => theme.colors['titleBar.activeBackground'] || theme.colors['editorGroupHeader.tabsBackground'],
			terminalTitlebarForeground: ({ theme }) => theme.colors['titleBar.activeForeground'],
			terminalTitlebarBorderBottom: ({ theme, resolveSetting }) =>
				theme.colors['titleBar.border'] || onBackground(resolveSetting('borderColor'), theme.type === 'dark' ? '#000000bf' : '#ffffffbf'),
			terminalBackground: ({ theme }) => theme.colors['terminal.background'],
			inlineButtonBackground: ({ resolveSetting }) => resolveSetting('frames.inlineButtonForeground'),
			inlineButtonBackgroundIdleOpacity: '0',
			inlineButtonBackgroundHoverOrFocusOpacity: '0.2',
			inlineButtonBackgroundActiveOpacity: '0.3',
			inlineButtonForeground: ({ resolveSetting }) => resolveSetting('codeForeground'),
			inlineButtonBorder: ({ resolveSetting }) => resolveSetting('frames.inlineButtonForeground'),
			inlineButtonBorderOpacity: '0.4',
			tooltipSuccessBackground: ({ theme }) => setLuminance(theme.colors['terminal.ansiGreen'] || '#0dbc79', 0.18),
			tooltipSuccessForeground: 'white',
		},
	},
})

export function getFramesBaseStyles({ cssVar }: ResolverContext, options: PluginFramesOptions) {
	const dotsSvg = [
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 16' preserveAspectRatio='xMidYMid meet'>`,
		`<circle cx='8' cy='8' r='8'/>`,
		`<circle cx='30' cy='8' r='8'/>`,
		`<circle cx='52' cy='8' r='8'/>`,
		`</svg>`,
	].join('')
	const escapedDotsSvg = dotsSvg.replace(/</g, '%3C').replace(/>/g, '%3E')
	const terminalTitlebarDots = `url("data:image/svg+xml,${escapedDotsSvg}")`

	const copySvg = [
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75'>`,
		`<path d='M3 19a2 2 0 0 1-1-2V2a2 2 0 0 1 1-1h13a2 2 0 0 1 2 1'/>`,
		`<rect x='6' y='5' width='16' height='18' rx='1.5' ry='1.5'/>`,
		`</svg>`,
	].join('')
	const escapedCopySvg = copySvg.replace(/</g, '%3C').replace(/>/g, '%3E')
	const copyToClipboard = `url("data:image/svg+xml,${escapedCopySvg}")`

	const tabBarBackground = [
		`linear-gradient(to top, ${cssVar('frames.editorTabBarBorderBottomColor')} ${cssVar('borderWidth')}, transparent ${cssVar('borderWidth')})`,
		`linear-gradient(${cssVar('frames.editorTabBarBackground')}, ${cssVar('frames.editorTabBarBackground')})`,
	].join(',')

	const frameStyles = `.frame {
		all: unset;
		position: relative;
		display: block;
		--header-border-radius: calc(${cssVar('borderRadius')} + ${cssVar('borderWidth')});
		--tab-border-radius: calc(${cssVar('frames.editorTabBorderRadius')} + ${cssVar('borderWidth')});
		--button-spacing: 0.4rem;
		--code-background: ${cssVar('frames.editorBackground')};
		border-radius: var(--header-border-radius);
		box-shadow: ${cssVar('frames.frameBoxShadowCssValue')};

		.header {
			display: none;
			z-index: 1;
			position: relative;

			border-radius: var(--header-border-radius) var(--header-border-radius) 0 0;
		}

		/* Styles to apply if we have a title bar or tab bar */
		&.has-title,
		&.is-terminal {
			& pre, & code {
				border-top: none;
				border-top-left-radius: 0;
				border-top-right-radius: 0;
			}
		}

		/* Prevent empty window titles from collapsing in height */
		.title:empty:before {
			content: '\\a0';
		}

		/* Editor tab bar */
		&.has-title:not(.is-terminal) {
			--button-spacing: calc(1.9rem + 2 * (${cssVar('uiPaddingBlock')} + ${cssVar('frames.editorActiveTabIndicatorHeight')}));

			/* Active editor tab */
			& .title {
				position: relative;
				color: ${cssVar('frames.editorActiveTabForeground')};
				background: ${cssVar('frames.editorActiveTabBackground')};
				background-clip: padding-box;
				margin-block-start: ${cssVar('frames.editorTabsMarginBlockStart')};
				padding: calc(${cssVar('uiPaddingBlock')} + ${cssVar('frames.editorActiveTabIndicatorHeight')}) ${cssVar('uiPaddingInline')};
				border: ${cssVar('borderWidth')} solid ${cssVar('frames.editorActiveTabBorderColor')};
				border-radius: var(--tab-border-radius) var(--tab-border-radius) 0 0;
				border-bottom: none;
				overflow: hidden;

				&::after {
					content: '';
					position: absolute;
					pointer-events: none;
					inset: 0;
					border-top: ${cssVar('frames.editorActiveTabIndicatorHeight')} solid ${cssVar('frames.editorActiveTabIndicatorTopColor')};
					border-bottom: ${cssVar('frames.editorActiveTabIndicatorHeight')} solid ${cssVar('frames.editorActiveTabIndicatorBottomColor')};
				}
			}

			/* Tab bar background */
			& .header {
				display: flex;

				background: ${tabBarBackground};
				background-repeat: no-repeat;

				padding-inline-start: ${cssVar('frames.editorTabsMarginInlineStart')};

				&::before {
					content: '';
					position: absolute;
					pointer-events: none;
					inset: 0;
					border: ${cssVar('borderWidth')} solid ${cssVar('frames.editorTabBarBorderColor')};
					border-radius: inherit;
					border-bottom: none;
				}
			}
		}

		/* Terminal window */
		&.is-terminal {
			--button-spacing: calc(1.9rem + ${cssVar('borderWidth')} + 2 * ${cssVar('uiPaddingBlock')});
			--code-background: ${cssVar('frames.terminalBackground')};

			/* Terminal title bar */
			& .header {
				display: flex;
				align-items: center;
				justify-content: center;
				padding-block: ${cssVar('uiPaddingBlock')};
				padding-block-end: calc(${cssVar('uiPaddingBlock')} + ${cssVar('borderWidth')});
				position: relative;

				font-weight: 500;
				letter-spacing: 0.025ch;

				color: ${cssVar('frames.terminalTitlebarForeground')};
				background: ${cssVar('frames.terminalTitlebarBackground')};
				border: ${cssVar('borderWidth')} solid ${cssVar('borderColor')};
				border-bottom: none;

				/* Display three dots at the left side of the header */
				&::before {
					content: '';
					position: absolute;
					pointer-events: none;
					left: ${cssVar('uiPaddingInline')};
					width: 2.1rem;
					height: ${(2.1 / 60) * 16}rem;
					line-height: 0;
					background-color: ${cssVar('frames.terminalTitlebarDotsForeground')};
					opacity: ${cssVar('frames.terminalTitlebarDotsOpacity')};
					-webkit-mask-image: ${terminalTitlebarDots};
					-webkit-mask-repeat: no-repeat;
					mask-image: ${terminalTitlebarDots};
					mask-repeat: no-repeat;
				}
				/* Display a border below the header */
				&::after {
					content: '';
					position: absolute;
					pointer-events: none;
					inset: 0;
					border-bottom: ${cssVar('borderWidth')} solid ${cssVar('frames.terminalTitlebarBorderBottom')};
				}
			}
		}

		/* Code */
		& pre {
			background: var(--code-background);
		}
	}`

	const copyButtonStyles = `.copy {
		display: flex;
		gap: 0.25rem;
		flex-direction: row;
		position: absolute;
		inset-block-start: calc(${cssVar('borderWidth')} + var(--button-spacing));
		inset-inline-end: calc(${cssVar('borderWidth')} + ${cssVar('uiPaddingInline')} / 2);

		/* RTL support: Code is always LTR, so the inline copy button
		   must match this to avoid overlapping the start of lines */
		direction: ltr;
		unicode-bidi: isolate;

		button {
			position: relative;
			align-self: flex-end;
			margin: 0;
			padding: 0;
			border: none;
			border-radius: 0.2rem;
			z-index: 1;
			cursor: pointer;

			transition-property: opacity, background, border-color;
			transition-duration: 0.2s;
			transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);

			/* Mobile-first styles: Make the button visible and tappable */
			width: 2.5rem;
			height: 2.5rem;
			background: var(--code-background);
			opacity: 0.75;

			div {
				position: absolute;
				inset: 0;
				border-radius: inherit;

				background: ${cssVar('frames.inlineButtonBackground')};
				opacity: ${cssVar('frames.inlineButtonBackgroundIdleOpacity')};

				transition-property: inherit;
				transition-duration: inherit;
				transition-timing-function: inherit;
			}

			&::before {
				content: '';
				position: absolute;
				pointer-events: none;
				inset: 0;
				border-radius: inherit;
				border: ${cssVar('borderWidth')} solid ${cssVar('frames.inlineButtonBorder')};
				opacity: ${cssVar('frames.inlineButtonBorderOpacity')};
			}
			
			&::after {
				content: '';
				position: absolute;
				pointer-events: none;
				inset: 0;
				background-color: ${cssVar('frames.inlineButtonForeground')};
				-webkit-mask-image: ${copyToClipboard};
				-webkit-mask-repeat: no-repeat;
				mask-image: ${copyToClipboard};
				mask-repeat: no-repeat;
				margin: 0.475rem;
				line-height: 0;
			}

			/*
				On hover or focus, make the button fully opaque
				and set hover/focus background opacity
			*/
			&:hover, &:focus:focus-visible {
				opacity: 1;
				div {
					opacity: ${cssVar('frames.inlineButtonBackgroundHoverOrFocusOpacity')};
				}
			}

			/* On press, set active background opacity */
			&:active {
				opacity: 1;
				div {
					opacity: ${cssVar('frames.inlineButtonBackgroundActiveOpacity')};
				}
			}
		}

		.feedback {
			--tooltip-arrow-size: 0.35rem;
			--tooltip-bg: ${cssVar('frames.tooltipSuccessBackground')};
			color: ${cssVar('frames.tooltipSuccessForeground')};
			pointer-events: none;
			user-select: none;
			-webkit-user-select: none;
			position: relative;
			align-self: center;
			background-color: var(--tooltip-bg);
			z-index: 99;
			padding: 0.125rem 0.75rem;
			border-radius: 0.2rem;
			margin-inline-end: var(--tooltip-arrow-size);
			opacity: 0;
			transition-property: opacity, transform;
			transition-duration: 0.2s;
			transition-timing-function: ease-in-out;
			transform: translate3d(0, 0.25rem, 0);

			&::after {
				content: '';
				position: absolute;
				pointer-events: none;
				top: calc(50% - var(--tooltip-arrow-size));
				inset-inline-end: calc(-2 * (var(--tooltip-arrow-size) - 0.5px));
				border: var(--tooltip-arrow-size) solid transparent;
				border-inline-start-color: var(--tooltip-bg);
			}

			&.show {
				opacity: 1;
				transform: translate3d(0, 0, 0);
			}
		}

	}

	@media (hover: hover) {
		/* If a mouse is available, hide the button by default and make it smaller */
		.copy button {
			opacity: 0;
			width: 2rem;
			height: 2rem;
		}

		/* Reveal the non-hovered button in the following cases:
			- when the frame is hovered
			- when a sibling inside the frame is focused
			- when the copy button shows a visible feedback message
		*/
		.frame:hover .copy button:not(:hover),
		.frame:focus-within :focus-visible ~ .copy button:not(:hover),
		.frame .copy .feedback.show ~ button:not(:hover) {
			opacity: 0.75;
		}
	}`

	const styles = [
		// Always add base frame styles
		frameStyles,
		// Add copy button styles if enabled
		options.showCopyToClipboardButton ? copyButtonStyles : '',
	]

	return styles.join('\n')
}
