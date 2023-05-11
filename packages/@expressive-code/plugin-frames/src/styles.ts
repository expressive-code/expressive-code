import { StyleSettings, multiplyAlpha, ExpressiveCodeTheme, ResolvedCoreStyles, onBackground, toRgbaString } from '@expressive-code/core'

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
			display: block;
			--header-border-radius: calc(${coreStyles.borderRadius} + ${coreStyles.borderWidth});
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

			/* Editor tab bar */
			&.has-title:not(.is-terminal) {
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
				/* Terminal title bar */
				& .header {
					display: flex;
					align-items: center;
					justify-content: center;
					padding-bottom: 0.175rem;
					min-height: 1.75rem;
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
	`

	return styles
}
