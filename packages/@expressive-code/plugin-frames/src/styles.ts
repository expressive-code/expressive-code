import { StyleSettings, multiplyAlpha, ExpressiveCodeTheme, ResolvedCoreStyles, onBackground, setLuminance } from '@expressive-code/core'
import { PluginFramesOptions } from '.'
import { StyleOverrides } from '@expressive-code/core'

export interface FramesStyleSettings {
	/**
	 * The color to use for the shadow of the frame.
	 * @default
	 * ({ theme }) => theme.colors['widget.shadow'] || multiplyAlpha(coreStyles.borderColor, 0.75)
	 */
	shadowColor: string
	/**
	 * The CSS value for the box shadow of the frame.
	 * @default
	 * ({ resolveSetting }) => `0.1rem 0.1rem 0.2rem ${resolveSetting('shadowColor')}`
	 */
	frameBoxShadowCssValue: string
	/**
	 * The background color of the active editor tab.
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
	editorActiveTabBorder: string
	/**
	 * The height of the highlight border indicating the active editor tab.
	 * This is the colorful line that appears at the top and/or bottom of the active tab.
	 * @default
	 * ({ coreStyles }) => coreStyles.borderWidth
	 */
	editorActiveTabHighlightHeight: string
	/**
	 * The color of the top highlight border indicating the active editor tab.
	 * @default
	 * ({ theme }) => theme.colors['tab.activeBorderTop']
	 */
	editorActiveTabBorderTop: string
	/**
	 * The color of the bottom highlight border indicating the active editor tab.
	 * @default
	 * ({ theme }) => theme.colors['tab.activeBorder']
	 */
	editorActiveTabBorderBottom: string
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
	 * ({ coreStyles }) => coreStyles.borderRadius
	 */
	editorTabBorderRadius: string
	/**
	 * The background color of the editor tab bar.
	 * @default
	 * ({ theme }) => theme.colors['editorGroupHeader.tabsBackground']
	 */
	editorTabBarBackground: string
	/**
	 * The border color of the editor tab bar.
	 * @default
	 * ({ coreStyles }) => coreStyles.borderColor
	 */
	editorTabBarBorderColor: string
	/**
	 * The color of the border between the editor tab bar and the code contents.
	 * @default
	 * ({ theme }) => theme.colors['editorGroupHeader.tabsBorder'] || 'transparent'
	 */
	editorTabBarBorderBottom: string
	/**
	 * The background color of the code editor.
	 * This color is used for the "code" frame type.
	 * @default
	 * ({ coreStyles }) => coreStyles.codeBackground
	 */
	editorBackground: string
	/**
	 * The color of the three dots in the terminal title bar.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('terminalTitlebarForeground')
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
	 * ({ theme, coreStyles }) =>
	 *   theme.colors['titleBar.border'] ||
	 *   onBackground(coreStyles.borderColor, theme.type === 'dark' ? '#000000bf' : '#ffffffbf')
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
	 * ({ resolveSetting }) => resolveSetting('inlineButtonForeground')
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
	 * ({ coreStyles }) => coreStyles.codeForeground
	 */
	inlineButtonForeground: string
	/**
	 * The border color of the copy button.
	 * @default
	 * ({ resolveSetting }) => resolveSetting('inlineButtonForeground')
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

export const framesStyleSettings = new StyleSettings<FramesStyleSettings>({
	styleOverridesSubpath: 'frames',
	defaultSettings: {
		shadowColor: ({ theme, coreStyles }) => theme.colors['widget.shadow'] || multiplyAlpha(coreStyles.borderColor, 0.75),
		frameBoxShadowCssValue: ({ resolveSetting }) => `0.1rem 0.1rem 0.2rem ${resolveSetting('shadowColor')}`,
		editorActiveTabBackground: ({ theme }) => theme.colors['tab.activeBackground'],
		editorActiveTabForeground: ({ theme }) => theme.colors['tab.activeForeground'],
		editorActiveTabBorder: 'transparent',
		editorActiveTabHighlightHeight: ({ coreStyles }) => coreStyles.borderWidth,
		editorActiveTabBorderTop: ({ theme }) => theme.colors['tab.activeBorderTop'],
		editorActiveTabBorderBottom: ({ theme }) => theme.colors['tab.activeBorder'],
		editorTabsMarginInlineStart: '0',
		editorTabsMarginBlockStart: '0',
		editorTabBorderRadius: ({ coreStyles }) => coreStyles.borderRadius,
		editorTabBarBackground: ({ theme }) => theme.colors['editorGroupHeader.tabsBackground'],
		editorTabBarBorderColor: ({ coreStyles }) => coreStyles.borderColor,
		editorTabBarBorderBottom: ({ theme }) => theme.colors['editorGroupHeader.tabsBorder'] || 'transparent',
		editorBackground: ({ coreStyles }) => coreStyles.codeBackground,
		terminalTitlebarDotsForeground: ({ resolveSetting }) => resolveSetting('terminalTitlebarForeground'),
		terminalTitlebarDotsOpacity: '0.15',
		terminalTitlebarBackground: ({ theme }) => theme.colors['titleBar.activeBackground'] || theme.colors['editorGroupHeader.tabsBackground'],
		terminalTitlebarForeground: ({ theme }) => theme.colors['titleBar.activeForeground'],
		terminalTitlebarBorderBottom: ({ theme, coreStyles }) =>
			theme.colors['titleBar.border'] || onBackground(coreStyles.borderColor, theme.type === 'dark' ? '#000000bf' : '#ffffffbf'),
		terminalBackground: ({ theme }) => theme.colors['terminal.background'],
		inlineButtonBackground: ({ resolveSetting }) => resolveSetting('inlineButtonForeground'),
		inlineButtonBackgroundIdleOpacity: '0',
		inlineButtonBackgroundHoverOrFocusOpacity: '0.2',
		inlineButtonBackgroundActiveOpacity: '0.3',
		inlineButtonForeground: ({ coreStyles }) => coreStyles.codeForeground,
		inlineButtonBorder: ({ resolveSetting }) => resolveSetting('inlineButtonForeground'),
		inlineButtonBorderOpacity: '0.4',
		tooltipSuccessBackground: ({ theme }) => setLuminance(theme.colors['terminal.ansiGreen'] || '#0dbc79', 0.18),
		tooltipSuccessForeground: 'white',
	},
})

declare module '@expressive-code/core' {
	export interface StyleOverrides {
		frames: Partial<typeof framesStyleSettings.defaultSettings>
	}
}

export function getFramesBaseStyles(theme: ExpressiveCodeTheme, coreStyles: ResolvedCoreStyles, styleOverrides: Partial<StyleOverrides> | undefined, options: PluginFramesOptions) {
	const framesStyles = framesStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides,
	})

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

	const getBorderColor = (color: string) => (color && ['transparent', 'none'].indexOf(color) === -1 ? color : undefined)
	const editorActiveTabBorderTop = getBorderColor(framesStyles.editorActiveTabBorderTop)
	const editorActiveTabBorderBottom = getBorderColor(framesStyles.editorActiveTabBorderBottom)

	const tabBarBackground = [
		`linear-gradient(to top, ${framesStyles.editorTabBarBorderBottom} ${coreStyles.borderWidth}, transparent ${coreStyles.borderWidth})`,
		`linear-gradient(${framesStyles.editorTabBarBackground}, ${framesStyles.editorTabBarBackground})`,
	].join(',')

	const frameStyles = `.frame {
		all: unset;
		position: relative;
		display: block;
		--header-border-radius: calc(${coreStyles.borderRadius} + ${coreStyles.borderWidth});
		--tab-border-radius: calc(${framesStyles.editorTabBorderRadius} + ${coreStyles.borderWidth});
		--button-spacing: 0.4rem;
		--code-background: ${framesStyles.editorBackground};
		border-radius: var(--header-border-radius);
		box-shadow: ${framesStyles.frameBoxShadowCssValue};

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
			--button-spacing: calc(1.9rem + 2 * (${coreStyles.uiPaddingBlock} + ${framesStyles.editorActiveTabHighlightHeight}));

			/* Active editor tab */
			& .title {
				position: relative;
				color: ${framesStyles.editorActiveTabForeground};
				background: ${framesStyles.editorActiveTabBackground};
				background-clip: padding-box;
				margin-block-start: ${framesStyles.editorTabsMarginBlockStart};
				padding: calc(${coreStyles.uiPaddingBlock} + ${framesStyles.editorActiveTabHighlightHeight}) ${coreStyles.uiPaddingInline};
				border: ${coreStyles.borderWidth} solid ${framesStyles.editorActiveTabBorder};
				border-radius: var(--tab-border-radius) var(--tab-border-radius) 0 0;
				border-bottom: none;
				overflow: hidden;

				&::after {
					content: '';
					position: absolute;
					pointer-events: none;
					inset: 0;
					${editorActiveTabBorderTop ? `border-top: ${framesStyles.editorActiveTabHighlightHeight} solid ${editorActiveTabBorderTop};` : ''}
					${editorActiveTabBorderBottom ? `border-bottom: ${framesStyles.editorActiveTabHighlightHeight} solid ${editorActiveTabBorderBottom};` : ''}
				}
			}

			/* Tab bar background */
			& .header {
				display: flex;

				background: ${tabBarBackground};
				background-repeat: no-repeat;

				padding-inline-start: ${framesStyles.editorTabsMarginInlineStart};

				&::before {
					content: '';
					position: absolute;
					pointer-events: none;
					inset: 0;
					border: ${coreStyles.borderWidth} solid ${framesStyles.editorTabBarBorderColor};
					border-radius: inherit;
					border-bottom: none;
				}
			}
		}

		/* Terminal window */
		&.is-terminal {
			--button-spacing: calc(1.9rem + ${coreStyles.borderWidth} + 2 * ${coreStyles.uiPaddingBlock});
			--code-background: ${framesStyles.terminalBackground};

			/* Terminal title bar */
			& .header {
				display: flex;
				align-items: center;
				justify-content: center;
				padding-block: ${coreStyles.uiPaddingBlock};
				padding-block-end: calc(${coreStyles.uiPaddingBlock} + ${coreStyles.borderWidth});
				position: relative;

				font-weight: 500;
				letter-spacing: 0.025ch;

				color: ${framesStyles.terminalTitlebarForeground};
				background: ${framesStyles.terminalTitlebarBackground};
				border: ${coreStyles.borderWidth} solid ${coreStyles.borderColor};
				border-bottom: none;

				/* Display three dots at the left side of the header */
				&::before {
					content: '';
					position: absolute;
					pointer-events: none;
					left: ${coreStyles.uiPaddingInline};
					width: 2.1rem;
					height: ${(2.1 / 60) * 16}rem;
					line-height: 0;
					background-color: ${framesStyles.terminalTitlebarDotsForeground};
					opacity: ${framesStyles.terminalTitlebarDotsOpacity};
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
					border-bottom: ${coreStyles.borderWidth} solid ${framesStyles.terminalTitlebarBorderBottom};
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
		inset-block-start: calc(${coreStyles.borderWidth} + var(--button-spacing));
		inset-inline-end: calc(${coreStyles.borderWidth} + ${coreStyles.uiPaddingInline} / 2);

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

				background: ${framesStyles.inlineButtonBackground};
				opacity: ${framesStyles.inlineButtonBackgroundIdleOpacity};

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
				border: ${coreStyles.borderWidth} solid ${framesStyles.inlineButtonBorder};
				opacity: ${framesStyles.inlineButtonBorderOpacity};
			}
			
			&::after {
				content: '';
				position: absolute;
				pointer-events: none;
				inset: 0;
				background-color: ${framesStyles.inlineButtonForeground};
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
					opacity: ${framesStyles.inlineButtonBackgroundHoverOrFocusOpacity};
				}
			}

			/* On press, set active background opacity */
			&:active {
				opacity: 1;
				div {
					opacity: ${framesStyles.inlineButtonBackgroundActiveOpacity};
				}
			}
		}

		.feedback {
			--tooltip-arrow-size: 0.35rem;
			--tooltip-bg: ${framesStyles.tooltipSuccessBackground};
			color: ${framesStyles.tooltipSuccessForeground};
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
