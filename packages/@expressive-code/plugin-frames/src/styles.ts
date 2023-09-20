import { StyleSettings, multiplyAlpha, ExpressiveCodeTheme, ResolvedCoreStyles, onBackground, setLuminance } from '@expressive-code/core'
import { PluginFramesOptions } from '.'

export const framesStyleSettings = new StyleSettings({
	shadowColor: ({ theme, coreStyles }) => theme.colors['widget.shadow'] || multiplyAlpha(coreStyles.borderColor, 0.75),
	frameBoxShadowCssValue: ({ resolveSetting }) => `0.1rem 0.1rem 0.2rem ${resolveSetting('shadowColor')}`,
	editorActiveTabBackground: ({ theme }) => theme.colors['tab.activeBackground'],
	editorActiveTabForeground: ({ theme }) => theme.colors['tab.activeForeground'],
	editorActiveTabBorder: 'transparent',
	editorActiveTabHighlightHeight: ({ coreStyles }) => coreStyles.borderWidth,
	editorActiveTabBorderTop: ({ theme }) => theme.colors['tab.activeBorderTop'],
	editorActiveTabBorderBottom: ({ theme }) => theme.colors['tab.activeBorder'],
	editorActiveTabMarginInlineStart: '0',
	editorActiveTabMarginBlockStart: '0',
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
})

declare module '@expressive-code/core' {
	export interface StyleOverrides {
		frames: Partial<typeof framesStyleSettings.defaultSettings>
	}
}

export function getFramesBaseStyles(
	theme: ExpressiveCodeTheme,
	coreStyles: ResolvedCoreStyles,
	styleOverrides: Partial<typeof framesStyleSettings.defaultSettings>,
	options: PluginFramesOptions
) {
	const framesStyles = framesStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides,
		themeStyleOverrides: theme.styleOverrides.frames,
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

	const activeTabBackgrounds: string[] = []
	if (framesStyles.editorActiveTabBorderTop) {
		activeTabBackgrounds.push(
			`linear-gradient(to bottom, ${framesStyles.editorActiveTabBorderTop} ${framesStyles.editorActiveTabHighlightHeight}, transparent ${framesStyles.editorActiveTabHighlightHeight})`
		)
	}
	if (framesStyles.editorActiveTabBorderBottom) {
		activeTabBackgrounds.push(
			`linear-gradient(to top, ${framesStyles.editorActiveTabBorderBottom} ${framesStyles.editorActiveTabHighlightHeight}, transparent ${framesStyles.editorActiveTabHighlightHeight})`
		)
	}
	if (activeTabBackgrounds.length) {
		activeTabBackgrounds.push(`linear-gradient(${framesStyles.editorActiveTabBackground}, ${framesStyles.editorActiveTabBackground})`)
	} else {
		activeTabBackgrounds.push(framesStyles.editorActiveTabBackground)
	}
	const activeTabBackground = activeTabBackgrounds.join(',')

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
				background: ${activeTabBackground};
				background-clip: padding-box;
				background-repeat: no-repeat;
				margin-block-start: ${framesStyles.editorActiveTabMarginBlockStart};
				padding: calc(${coreStyles.uiPaddingBlock} + ${framesStyles.editorActiveTabHighlightHeight}) ${coreStyles.uiPaddingInline};
				border: ${coreStyles.borderWidth} solid ${framesStyles.editorActiveTabBorder};
				border-radius: var(--tab-border-radius) var(--tab-border-radius) 0 0;
				border-bottom: none;
			}

			/* Tab bar background */
			& .header {
				display: flex;

				background: ${tabBarBackground};
				background-repeat: no-repeat;

				padding-inline-start: ${framesStyles.editorActiveTabMarginInlineStart};

				&::after {
					content: '';
					position: absolute;
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
					background-color: ${framesStyles.terminalTitlebarDotsForeground};
					opacity: ${framesStyles.terminalTitlebarDotsOpacity};
					-webkit-mask-image: ${terminalTitlebarDots};
					-webkit-mask-repeat: no-repeat;
					mask-image: ${terminalTitlebarDots};
					mask-repeat: no-repeat;
					position: absolute;
					left: ${coreStyles.uiPaddingInline};
					width: 2.1rem;
					height: ${(2.1 / 60) * 16}rem;
					line-height: 0;
				}
				/* Display a border below the header */
				&::after {
					content: '';
					position: absolute;
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
				inset: 0;
				border-radius: inherit;
				border: ${coreStyles.borderWidth} solid ${framesStyles.inlineButtonBorder};
				opacity: ${framesStyles.inlineButtonBorderOpacity};
			}
			
			&::after {
				content: '';
				background-color: ${framesStyles.inlineButtonForeground};
				-webkit-mask-image: ${copyToClipboard};
				-webkit-mask-repeat: no-repeat;
				mask-image: ${copyToClipboard};
				mask-repeat: no-repeat;
				position: absolute;
				inset: 0;
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
				position: absolute;
				content: '';
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
