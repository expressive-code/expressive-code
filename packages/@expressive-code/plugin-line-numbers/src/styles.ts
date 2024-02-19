import { PluginStyleSettings, ResolverContext } from '@expressive-code/core'

export interface LineNumbersStyleSettings {
	/**
	 * Allows overriding the foreground color to use for line numbers.
	 *
	 * By default, line numbers inherit the gutter foreground color defined by the
	 * `gutterForeground` core style setting.
	 *
	 * @default 'inherit'
	 */
	foreground: string
	/**
	 * Allows overriding the foreground color to use for highlighted line numbers.
	 *
	 * By default, highlighted line numbers inherit the gutter highlighted foreground color
	 * defined by the `gutterHighlightForeground` core style setting.
	 *
	 * @default 'inherit'
	 */
	highlightForeground: string
}

declare module '@expressive-code/core' {
	export interface StyleSettings {
		lineNumbers: LineNumbersStyleSettings
	}
}

export const lineNumbersStyleSettings = new PluginStyleSettings({
	defaultValues: {
		lineNumbers: {
			foreground: 'inherit',
			highlightForeground: 'inherit',
		},
	},
})

export function getLineNumbersBaseStyles({ cssVar }: ResolverContext) {
	const result = `
		.gutter .ln {
			display: inline-flex;
			justify-content: flex-end;
			align-items: flex-start;
			box-sizing: content-box;
			min-width: var(--lnWidth, 2ch);
			padding-inline: 2ch;
			color: ${cssVar('lineNumbers.foreground')};
			.highlight & {
				color: ${cssVar('lineNumbers.highlightForeground')};
			}
		}
	`

	return result
}
