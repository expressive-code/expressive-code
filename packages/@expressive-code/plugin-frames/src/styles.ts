import { StyleSettings, multiplyAlpha, ExpressiveCodeTheme, ResolvedCoreStyles } from '@expressive-code/core'

export const framesStyleSettings = new StyleSettings({
	editorActiveTabBackground: ({ theme }) => theme.colors['tab.activeBackground'],
	editorActiveTabForeground: ({ theme }) => theme.colors['tab.activeForeground'],
	editorActiveTabBorderTop: ({ theme }) => theme.colors['tab.activeBorderTop'] || theme.colors['tab.border'],
	editorActiveTabBorderBottom: ({ theme }) => theme.colors['tab.activeBorder'],
	editorTabBorderRadius: ({ coreStyles }) => coreStyles.borderRadius,
	editorTabBorderRight: ({ theme }) => theme.colors['tab.border'] || 'transparent',
	editorTabBarBackground: ({ theme }) => multiplyAlpha(theme.colors['editorGroupHeader.tabsBackground'], 0.5),
	editorTabBarBorderBottom: ({ theme, coreStyles }) => `${coreStyles.borderWidth} solid ${theme.colors['editorGroupHeader.tabsBorder'] || 'transparent'}`,
	editorBackground: ({ coreStyles }) => coreStyles.codeBackground,
	terminalTitlebarDotsForeground: ({ theme }) => (theme.type === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'),
	terminalTitlebarBackground: ({ theme }) => theme.colors['titleBar.activeBackground'],
	terminalBackground: ({ theme }) => theme.colors['terminal.background'],
})

export function getFramesBaseStyles(theme: ExpressiveCodeTheme, coreStyles: ResolvedCoreStyles, styleOverrides: Partial<typeof framesStyleSettings.defaultSettings>) {
	const { colors } = theme
	const framesStyles = framesStyleSettings.resolve({
		theme,
		coreStyles,
		styleOverrides,
	})

	const dotsSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 16' preserveAspectRatio='xMidYMid meet' fill='${framesStyles.terminalTitlebarDotsForeground}'><circle cx='8' cy='8' r='8'/><circle cx='30' cy='8' r='8'/><circle cx='52' cy='8' r='8'/></svg>`
	const escapedDotsSvg = dotsSvg.replace(/</g, '%3C').replace(/>/g, '%3E')
	const terminalTitlebarDots = `url("data:image/svg+xml,${escapedDotsSvg}")`

	const styles = `
		.frame {
			all: unset;

			.header {
				display: none;
				z-index: 1;
				position: relative;

				border: ${coreStyles.borderWidth} solid ${coreStyles.borderColor};
				border-bottom: none;
				--header-border-radius: calc(${coreStyles.borderRadius} + ${coreStyles.borderWidth});
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
					background-color: ${framesStyles.editorActiveTabBackground};
					padding: ${coreStyles.uiPaddingBlock} ${coreStyles.uiPaddingInline};
					border-radius: ${framesStyles.editorTabBorderRadius} ${framesStyles.editorTabBorderRadius} 0 0;
					border-top: ${coreStyles.borderWidth} solid ${framesStyles.editorActiveTabBorderTop};
					border-bottom: ${coreStyles.borderWidth} solid ${framesStyles.editorActiveTabBorderBottom};
					box-shadow: 1px 0 0 ${framesStyles.editorTabBorderRight};
				}

				/* Tab bar background */
				& .header {
					display: flex;
					background-color: ${framesStyles.editorTabBarBackground};
					&::after {
						flex-grow: 1;
						content: '';
						border-bottom: ${framesStyles.editorTabBarBorderBottom};
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

					color: ${colors['titleBar.activeForeground']};
					background-color: ${colors['titleBar.activeBackground']};

					/*
					color: ${colors['panelTitle.activeForeground']};
					& .title {
						border-bottom: ${coreStyles.borderWidth} solid ${colors['panelTitle.activeBorder'] || 'transparent'};
					}
					*/

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
						border-bottom: ${coreStyles.borderWidth} solid ${colors['titleBar.border'] || colors['editorGroupHeader.tabsBorder'] || 'transparent'};
					}
				}

				/* Terminal content */
				& pre {
					background-color: ${framesStyles.terminalBackground};
				}
			}
		}
	`

	return styles
}
