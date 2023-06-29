import { StyleSettings, multiplyAlpha, ExpressiveCodeTheme, ResolvedCoreStyles, onBackground, toRgbaString, setAlpha } from '@expressive-code/core'

export const framesStyleSettings = new StyleSettings({
	shadowColor: ({ theme, coreStyles }) => theme.colors['widget.shadow'] || multiplyAlpha(coreStyles.borderColor, 0.75),
	frameBoxShadowCssValue: ({ resolveSetting }) => `0.1rem 0.1rem 0.2rem ${resolveSetting('shadowColor')}`,
	editorActiveTabBackground: ({ theme }) => theme.colors['tab.activeBackground'],
	editorActiveTabForeground: ({ theme }) => theme.colors['tab.activeForeground'],
	editorActiveTabBorder: 'transparent',
	editorActiveTabBorderTop: ({ theme }) => theme.colors['tab.activeBorderTop'],
	editorActiveTabBorderBottom: ({ theme }) => theme.colors['tab.activeBorder'],
	editorActiveTabMarginInlineStart: '0',
	editorActiveTabMarginBlockStart: '0',
	editorTabBorderRadius: ({ coreStyles }) => coreStyles.borderRadius,
	editorTabBarBackground: ({ theme }) => theme.colors['editorGroupHeader.tabsBackground'],
	editorTabBarBorderColor: ({ coreStyles }) => coreStyles.borderColor,
	editorTabBarBorderBottom: ({ theme }) => theme.colors['editorGroupHeader.tabsBorder'] || 'transparent',
	editorBackground: ({ coreStyles }) => coreStyles.codeBackground,
	terminalTitlebarDotsForeground: ({ theme }) => (theme.type === 'dark' ? '#ffffff26' : '#00000026'),
	terminalTitlebarBackground: ({ theme }) => theme.colors['editorGroupHeader.tabsBackground'],
	terminalTitlebarForeground: ({ theme }) => theme.colors['titleBar.activeForeground'],
	terminalTitlebarBorderBottom: ({ theme, coreStyles }) => onBackground(coreStyles.borderColor, theme.type === 'dark' ? '#000000bf' : '#ffffffbf'),
	terminalBackground: ({ theme }) => theme.colors['terminal.background'],
	inlineButtonForeground: ({ coreStyles }) => coreStyles.codeForeground,
	inlineButtonHoverBackground: ({ resolveSetting }) => setAlpha(resolveSetting('inlineButtonForeground'), 0.2),
	inlineButtonActiveBorder: ({ resolveSetting }) => setAlpha(resolveSetting('inlineButtonForeground'), 0.4),
	tooltipSuccessBackground: '#177d07',
	tooltipSuccessForeground: 'white',
})

export function getFramesBaseStyles(theme: ExpressiveCodeTheme, coreStyles: ResolvedCoreStyles, styleOverrides: Partial<typeof framesStyleSettings.defaultSettings>) {
	const framesStyles = framesStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides,
	})

	const dotsColor = toRgbaString(framesStyles.terminalTitlebarDotsForeground)
	const dotsSvg = [
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 16' preserveAspectRatio='xMidYMid meet' fill='${dotsColor}'>`,
		`<circle cx='8' cy='8' r='8'/>`,
		`<circle cx='30' cy='8' r='8'/>`,
		`<circle cx='52' cy='8' r='8'/>`,
		`</svg>`,
	].join('')
	const escapedDotsSvg = dotsSvg.replace(/</g, '%3C').replace(/>/g, '%3E')
	const terminalTitlebarDots = `url("data:image/svg+xml,${escapedDotsSvg}")`
	const inlineButtonFg = toRgbaString(framesStyles.inlineButtonForeground)
	const copySvg = [
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${inlineButtonFg}' stroke-width='1.75'>`,
		`<path d='M3 19a2 2 0 0 1-1-2V2a2 2 0 0 1 1-1h13a2 2 0 0 1 2 1'/>`,
		`<rect x='6' y='5' width='16' height='18' rx='1.5' ry='1.5'/>`,
		`</svg>`,
	].join('')

	const escapedCopySvg = copySvg.replace(/</g, '%3C').replace(/>/g, '%3E')
	const copyToClipboard = `url("data:image/svg+xml,${escapedCopySvg}")`

	const activeTabBackgrounds: string[] = []
	if (framesStyles.editorActiveTabBorderTop) {
		activeTabBackgrounds.push(`linear-gradient(to bottom, ${framesStyles.editorActiveTabBorderTop} ${coreStyles.borderWidth}, transparent ${coreStyles.borderWidth})`)
	}
	if (framesStyles.editorActiveTabBorderBottom) {
		activeTabBackgrounds.push(`linear-gradient(to top, ${framesStyles.editorActiveTabBorderBottom} ${coreStyles.borderWidth}, transparent ${coreStyles.borderWidth})`)
	}
	if (activeTabBackgrounds.length) {
		activeTabBackgrounds.push(`linear-gradient(${framesStyles.editorActiveTabBackground}, ${framesStyles.editorActiveTabBackground})`)
	} else {
		activeTabBackgrounds.push(framesStyles.editorActiveTabBackground)
	}
	const activeTabBackground = activeTabBackgrounds.join(',')

	const styles = `
		.frame {
			all: unset;
			position: relative;
			display: block;
			--header-border-radius: calc(${coreStyles.borderRadius} + ${coreStyles.borderWidth});
			--button-spacing: 0.4rem;
			border-radius: var(--header-border-radius);
			box-shadow: ${framesStyles.frameBoxShadowCssValue};

			.header {
				display: none;
				z-index: 1;
				position: relative;

				border: ${coreStyles.borderWidth} solid ${coreStyles.borderColor};
				border-bottom: none;
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
				--button-spacing: 0.15rem;

				/* Active editor tab */
				& .title {
					position: relative;
					color: ${framesStyles.editorActiveTabForeground};
					background: ${activeTabBackground};
					background-clip: padding-box;
					margin-block-start: ${framesStyles.editorActiveTabMarginBlockStart};
					padding: ${coreStyles.uiPaddingBlock} ${coreStyles.uiPaddingInline};
					border-radius: ${framesStyles.editorTabBorderRadius} ${framesStyles.editorTabBorderRadius} 0 0;
					border: ${coreStyles.borderWidth} solid ${framesStyles.editorActiveTabBorder};
					border-bottom: none;
				}

				/* Tab bar background */
				& .header {
					border-color: ${framesStyles.editorTabBarBorderColor};
					display: flex;
					background: ${framesStyles.editorTabBarBackground};
					background-clip: padding-box;
					&::before {
						padding-inline-start: ${framesStyles.editorActiveTabMarginInlineStart};
					}
					&::after {
						flex-grow: 1;
					}
					&::before,
					&::after {
						content: '';
						border-bottom: ${coreStyles.borderWidth} solid ${framesStyles.editorTabBarBorderBottom};
					}
				}
			}

			/* Terminal window */
			&.is-terminal {
				--button-spacing: 0.075rem;

				/* Terminal title bar */
				& .header {
					display: flex;
					align-items: center;
					justify-content: center;
					padding-block: ${coreStyles.uiPaddingBlock};
					position: relative;

					font-weight: 500;
					letter-spacing: 0.025ch;

					color: ${framesStyles.terminalTitlebarForeground};
					background: ${framesStyles.terminalTitlebarBackground};
					background-clip: padding-box;

					/* Display three dots at the left side of the header */
					&::before {
						content: ${terminalTitlebarDots};
						position: absolute;
						left: ${coreStyles.uiPaddingInline};
						width: 2.1rem;
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

				/* Terminal content */
				& pre {
					background: ${framesStyles.terminalBackground};
					background-clip: padding-box;
				}
			}
		}
		.copy {
			display: flex;
			gap: 0.25rem;
			flex-direction: row-reverse;
			position: absolute;
			inset-block-start: calc(${coreStyles.borderWidth} + var(--button-spacing));
			inset-inline-end: calc(${coreStyles.borderWidth} + ${coreStyles.uiPaddingInline} / 2);

			button {
				align-self: flex-end;
				width: 1.75rem;
				height: 1.75rem;
				margin: 0;
				padding: 0.4rem;
				border-radius: 0.2rem;
				z-index: 2;
				cursor: pointer;

				background: transparent;
				border: ${coreStyles.borderWidth} solid transparent;
				opacity: 0.5;
				transition-property: opacity, background, border-color;
				transition-duration: 0.2s;
				transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);

				&:hover, &:focus:focus-visible {
					opacity: 0.75;
					background: ${framesStyles.inlineButtonHoverBackground};
				}

				&:active {
					transition-duration: 0s;
					opacity: 1;
					border-color: ${framesStyles.inlineButtonActiveBorder};
				}

				&::before {
					content: ${copyToClipboard};
					line-height: 0;
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
			}

			button:focus + .feedback.show {
				opacity: 1;
				transform: translate3d(0, 0, 0);
			}
		}
	`

	return styles
}
