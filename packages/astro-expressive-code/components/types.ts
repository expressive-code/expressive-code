// This type helper is required to support component props in MDX files
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Component<T> = (_props: T) => any

export type MarkerValueType = string | number | RegExp | (string | number | RegExp)[]

export interface CodeProps {
	/**
	 * The plaintext contents of the code block.
	 */
	code: string
	/**
	 * The code block's language.
	 *
	 * Please use a valid [language identifier](https://expressive-code.com/key-features/syntax-highlighting/#supported-languages)
	 * to ensure proper syntax highlighting.
	 */
	lang?: string | undefined
	/**
	 * An optional meta string. In markdown or MDX documents, this is the part of the
	 * code block's opening fence that comes after the language name.
	 */
	meta?: string | undefined
	/**
	 * The code block's locale (e.g. `en-US` or `de-DE`). This is used by plugins to display
	 * localized strings depending on the language of the containing page.
	 *
	 * If no locale is defined here, most Expressive Code integrations will attempt to auto-detect
	 * the block locale using the configured
	 * [`getBlockLocale`](https://expressive-code.com/reference/configuration/#getblocklocale)
	 * function, and finally fall back to the configured
	 * [`defaultLocale`](https://expressive-code.com/reference/configuration/#defaultlocale).
	 */
	locale?: string | undefined
	/**
	 * The code block's title.
	 *
	 * Depending on the frame type (code or terminal), this title is displayed by the
	 * [frames plugin](https://expressive-code.com/key-features/frames/) either as an
	 * open file tab label or as a terminal window title.
	 */
	title?: string | undefined
	/**
	 * The code block's [frame type](https://expressive-code.com/key-features/frames/#overriding-frame-types).
	 */
	frame?: 'auto' | 'code' | 'terminal' | 'none' | undefined
	/**
	 * Defines the code block's [text & line markers](https://expressive-code.com/key-features/text-markers/)
	 * of the default neutral type.
	 *
	 * You can either pass a single marker definition or an array of them.
	 */
	mark?: MarkerValueType | undefined
	/**
	 * Defines the code block's [text & line markers](https://expressive-code.com/key-features/text-markers/)
	 * of the "inserted" type.
	 *
	 * You can either pass a single marker definition or an array of them.
	 */
	ins?: MarkerValueType | undefined
	/**
	 * Defines the code block's [text & line markers](https://expressive-code.com/key-features/text-markers/)
	 * of the "deleted" type.
	 *
	 * You can either pass a single marker definition or an array of them.
	 */
	del?: MarkerValueType | undefined
	/**
	 * The CSS class name(s) to apply to the code block's container element.
	 */
	class?: string | undefined
}
