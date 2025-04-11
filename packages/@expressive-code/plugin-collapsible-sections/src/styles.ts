import { PluginStyleSettings, ResolverContext, codeLineClass, setAlpha } from '@expressive-code/core'

export const collapsibleSectionClass = 'ec-section'

export interface CollapsibleSectionsStyleSettings {
	/**
	 * The border width of the summary line.
	 *
	 * Note: Despite the setting prefix `closed`, summary lines are also visible
	 * while the section is open when using any of the `collapsible-*` styles.
	 * This is the same for all `closed*` settings.
	 * @default '0'
	 */
	closedBorderWidth: string
	/**
	 * The block padding of the summary line.
	 * @default '4px'
	 */
	closedPaddingBlock: string
	/**
	 * The margin around the summary line.
	 * @default '0'
	 */
	closedMargin: string
	/**
	 * The font family of the section summary line.
	 * @default 'inherit'
	 */
	closedFontFamily: string
	/**
	 * The font size of the section summary line.
	 * @default 'inherit'
	 */
	closedFontSize: string
	/**
	 * The line height of the section summary line.
	 * @default 'inherit'
	 */
	closedLineHeight: string
	/**
	 * The text color of the section summary line.
	 * @default 'inherit'
	 */
	closedTextColor: string
	/**
	 * The background color of the summary line.
	 * @default
	 * ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.2) || 'rgb(84 174 255 / 20%)'
	 */
	closedBackgroundColor: string
	/**
	 * The border color of the summary line.
	 * @default
	 * ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.5) || 'rgb(84 174 255 / 50%)'
	 */
	closedBorderColor: string
	/**
	 * The width of the border around expanded code lines.
	 * @default '1px'
	 */
	openBorderWidth: string
	/**
	 * The color of the border around expanded code lines.
	 * @default 'transparent'
	 */
	openBorderColor: string
	/**
	 * The padding of open sections.
	 * @default '0'
	 */
	openPadding: string
	/**
	 * The margin around open sections.
	 * @default '0'
	 */
	openMargin: string
	/**
	 * The background color of expanded code lines when using the default `github` style.
	 * @default 'transparent'
	 */
	openBackgroundColor: string
	/**
	 * The background color of expanded code lines when using any of the `collapsible-*` styles.
	 * @default
	 * ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.1) || 'rgb(84 174 255 / 10%)'
	 */
	openBackgroundColorCollapsible: string
}

export const collapsibleSectionsStyleSettings = new PluginStyleSettings({
	defaultValues: {
		collapsibleSections: {
			closedBorderWidth: '0',
			closedPaddingBlock: '4px',
			closedMargin: '0',
			closedFontFamily: 'inherit',
			closedFontSize: 'inherit',
			closedLineHeight: 'inherit',
			closedTextColor: ({ resolveSetting }) => resolveSetting('codeForeground'),
			closedBackgroundColor: ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.2) || 'rgb(84 174 255 / 20%)',
			closedBorderColor: ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.5) || 'rgb(84 174 255 / 50%)',
			openBorderWidth: '1px',
			openPadding: '0',
			openMargin: '0',
			openBackgroundColor: 'transparent',
			openBackgroundColorCollapsible: ({ theme }) => setAlpha(theme.colors['editor.foldBackground'], 0.1) || 'rgb(84 174 255 / 10%)',
			openBorderColor: 'transparent',
		},
	},
	cssVarReplacements: [['collapsibleSections', 'cs']],
	preventUnitlessValues: ['collapsibleSections.closedBorderWidth', 'collapsibleSections.openBorderWidth'],
})

export function getCollapsibleSectionsBaseStyles({ cssVar }: ResolverContext) {
	// Icon source: Octicons (MIT licensed)
	const unfoldSvg = createInlineSvgUrl(
		'm8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z'
	)
	const foldSvg = createInlineSvgUrl(
		'M10.896 2H8.75V.75a.75.75 0 0 0-1.5 0V2H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0l2.896-2.896A.25.25 0 0 0 10.896 2ZM8.75 15.25a.75.75 0 0 1-1.5 0V14H5.104a.25.25 0 0 1-.177-.427l2.896-2.896a.25.25 0 0 1 .354 0l2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25Zm-6.5-6.5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z'
	)
	return `
		.${collapsibleSectionClass} {
			position: relative;

			& summary {
				position: relative;

				font-family: ${cssVar('collapsibleSections.closedFontFamily')};
				font-size: ${cssVar('collapsibleSections.closedFontSize')};
				line-height: ${cssVar('collapsibleSections.closedLineHeight')};
				user-select: none;
				-webkit-user-select: none;

				cursor: pointer;
				color: ${cssVar('collapsibleSections.closedTextColor')};
				background-color: ${cssVar('collapsibleSections.closedBackgroundColor')};
				--border-color: ${cssVar('collapsibleSections.closedBorderColor')};
				--border-width: ${cssVar('collapsibleSections.closedBorderWidth')};
				box-shadow: inset 0 calc(-1 * var(--border-width)) var(--border-color), inset 0 var(--border-width) var(--border-color);
				margin: ${cssVar('collapsibleSections.closedMargin')};
				padding: 0;

				/* Hide the default <details> marker */
				&::marker {
					display: inline-block;
					content: "";
					width: 16px;
					height: 16px;
				}

				/* Workaround - ::marker does not support content on safari */
				&::-webkit-details-marker {
					display: none;
				}

				/* Expand & collapse icons */
				:is(.expand, .collapse) {
					position: relative;
					display: inline-block;
					width: 16px;
					height: 16px;
					vertical-align: text-bottom;
					opacity: 0.75;

					&::after {
						content: '';
						position: absolute;
						pointer-events: none;
						inset: 0;
						background-color: ${cssVar('collapsibleSections.closedTextColor')};
						-webkit-mask-repeat: no-repeat;
						mask-repeat: no-repeat;
						line-height: 0;
					}
				}
				.expand::after {
					-webkit-mask-image: ${unfoldSvg};
					mask-image: ${unfoldSvg};
					/* Ensure that the expand icons of closed sections get printed to avoid gap */
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
				.collapse {
					display: none;
					&::after {
						-webkit-mask-image: ${foldSvg};
						mask-image: ${foldSvg};
					}
				}
				.text {
					margin-left: 1em;
				}

				.${codeLineClass} .code {
					padding-block: ${cssVar('collapsibleSections.closedPaddingBlock')};
					text-indent: 0;
				}
			}

			/* Common open section styles */
			&[open],
			& details[open] + .content-lines {
				--border-color: ${cssVar('collapsibleSections.openBorderColor')};
				--border-width: ${cssVar('collapsibleSections.openBorderWidth')};
				box-shadow: inset 0 calc(-1 * var(--border-width)) var(--border-color), inset 0 var(--border-width) var(--border-color);
				padding-inline: ${cssVar('collapsibleSections.openPadding')};
				margin-inline: ${cssVar('collapsibleSections.openMargin')};
			}

			/* Collapse style 'github' (no wrapper around details) */
			&.github[open] {
				& summary {
					display: none;
				}
				background-color: ${cssVar('collapsibleSections.openBackgroundColor')};
			}

			/* Collapse styles 'collapsible-start' and 'collapsible-end' 
			   ('collapsible-auto' gets resolved during AST generation) */
			&:is(.collapsible-start, .collapsible-end) {
				display: flex;
				flex-direction: column;

				& .content-lines {
					display: none;
				}
				& details[open] {
					& .collapse { display: inline-block; }
					& :is(.expand, .text) { display: none; }
					& + .content-lines {
						display: block;
						background-color: ${cssVar('collapsibleSections.openBackgroundColorCollapsible')};
					}
					/* Hide re-collapsible headers of open sections when printing */
					@media print { display: none; }
				}
			}
			&.collapsible-end {
				flex-direction: column-reverse;
			}
		}
	`
}

function createInlineSvgUrl(d: string) {
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='${d}'/></svg>`
	const encodedSvg = svg.replace(/</g, '%3C').replace(/>/g, '%3E')
	return `url("data:image/svg+xml,${encodedSvg}")`
}
