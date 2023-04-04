import { StyleSettings, multiplyAlpha, ExpressiveCodeTheme, ResolvedCoreStyles } from '@expressive-code/core'

export const framesStyleSettings = new StyleSettings({
	editorActiveTabBackground: ({ theme }) => theme.colors['tab.activeBackground'],
	editorActiveTabForeground: ({ theme }) => theme.colors['tab.activeForeground'],
	editorTabBorderRadius: ({ coreStyles }) => coreStyles.borderRadius,
	editorTabBarBackground: ({ theme }) => multiplyAlpha(theme.colors['editorGroupHeader.tabsBackground'], 0.5),
	editorTabBarBorderBottom: ({ theme, coreStyles }) => `${coreStyles.borderWidth} solid ${theme.colors['editorGroupHeader.tabsBorder'] || 'transparent'}`,
	editorBackground: ({ coreStyles }) => coreStyles.codeBackground,
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

				font-family: ${coreStyles.uiFontFamily};
				font-size: 0.9rem;
				letter-spacing: 0.025ch;

				::selection {
					background-color: ${colors['menu.selectionBackground']};
				}
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
					color: ${framesStyles.editorActiveTabForeground};
					background-color: ${framesStyles.editorActiveTabBackground};
					padding: ${coreStyles.uiPaddingBlock} ${coreStyles.uiPaddingInline};
					border-radius: ${framesStyles.editorTabBorderRadius} ${framesStyles.editorTabBorderRadius} 0 0;
					border-top: ${coreStyles.borderWidth} solid ${colors['tab.activeBorderTop'] || colors['tab.border']};
					border-bottom: ${coreStyles.borderWidth} solid ${colors['tab.activeBorder']};
					border-right: 1px solid ${colors['tab.border'] || 'transparent'};
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

					color: ${colors['titleBar.activeForeground']};
					background-color: ${colors['titleBar.activeBackground']};
					border-bottom: ${coreStyles.borderWidth} solid ${colors['titleBar.border'] || colors['editorGroupHeader.tabsBorder'] || 'transparent'};

					/*
					color: ${colors['panelTitle.activeForeground']};
					& .title {
						border-bottom: ${coreStyles.borderWidth} solid ${colors['panelTitle.activeBorder'] || 'transparent'};
					}
					*/

					/* Display three dots at the left side of the header */
					&::before {
						content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 16' preserveAspectRatio='xMidYMid meet' fill='rgba(255, 255, 255, 0.15)'%3E%3Ccircle cx='8' cy='8' r='8'/%3E%3Ccircle cx='30' cy='8' r='8'/%3E%3Ccircle cx='52' cy='8' r='8'/%3E%3C/svg%3E");
						position: absolute;
						left: 1rem;
						width: 2.1rem;
						line-height: 0;
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
