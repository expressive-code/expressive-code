import type { StarlightUserConfig } from '@astrojs/starlight/types';
import type { AstroConfig } from 'astro';

/** Project configuration metadata passed from the integration to the routes in a virtual module. */
export interface ProjectContext {
	base: AstroConfig['base'];
	defaultLocale: StarlightUserConfig['defaultLocale'];
	locales: StarlightUserConfig['locales'];
	title: StarlightUserConfig['title'];
	description: StarlightUserConfig['description'];
	details: StarlightLllmsTextOptions['details'];
	optionalLinks: NonNullable<StarlightLllmsTextOptions['optionalLinks']>;
	minify: NonNullable<StarlightLllmsTextOptions['minify']>;
	promote: NonNullable<StarlightLllmsTextOptions['promote']>;
	demote: NonNullable<StarlightLllmsTextOptions['demote']>;
	exclude: NonNullable<StarlightLllmsTextOptions['exclude']>;
}

/** Plugin user options. */
export interface StarlightLllmsTextOptions {
	/**
	 * Provide a custom name for this project or software. This will be used in `llms.txt` to identify
	 * what the documentation is for.
	 *
	 * Default: the value of Starlight’s `title` option.
	 *
	 * @example "FastHTML"
	 */
	projectName?: string;

	/**
	 * Set a custom description for your documentation site to share with large language models.
	 * Can include Markdown syntax. Will be displayed in `llms.txt` immediately after the file’s title.
	 *
	 * According to <https://llmstxt.org/> this should be:
	 *
	 * > a short summary of the project, containing key information necessary for understanding the
	 * > rest of the file
	 *
	 * Default: The value of Starlight’s `description` option.
	 *
	 * @example
	 * ```md
	 * FastHTML is a python library which brings together Starlette, Uvicorn, HTMX, and fastcore's `FT` "FastTags" into a library for creating server-rendered hypermedia applications.
	 * ```
	 */
	description?: string;

	/**
	 * Provide addition details to add after the description in `llms.txt`.
	 *
	 * According to <https://llmstxt.org/> this should be:
	 *
	 * > Zero or more markdown sections (e.g. paragraphs, lists, etc) of any type except headings,
	 * > containing more detailed information about the project and how to interpret the provided files
	 *
	 * @example
	 * ```md
	 * Important notes:
	 *
	 * - Although parts of its API are inspired by FastAPI, it is *not* compatible with FastAPI syntax and is not targeted at creating API services
	 * - FastHTML is compatible with JS-native web components and any vanilla JS library, but not with React, Vue, or Svelte.
	 * ```
	 */
	details?: string;

	/**
	 * An array of optional links to add to the `llms.txt` entrypoint.
	 *
	 * URLs provided here can be skipped by the LLM if a shorter context is needed.
	 * Use it for secondary information which is not already in your docs content.
	 */
	optionalLinks?: Array<{
		label: string;
		url: string;
		description?: string;
	}>;

	/** Control what elements are removed in `llms-small.txt`. */
	minify?: {
		/**
		 * Remove Starlight note asides in `llms-small.txt`.
		 * @default true
		 */
		note?: boolean;
		/**
		 * Remove Starlight tip asides in `llms-small.txt`.
		 * @default true
		 */
		tip?: boolean;
		/**
		 * Remove Starlight caution asides in `llms-small.txt`.
		 * @default false
		 */
		caution?: boolean;
		/**
		 * Remove Starlight danger asides in `llms-small.txt`.
		 * @default false
		 */
		danger?: boolean;
		/**
		 * Remove HTML `<details>` elements in `llms-small.txt`.
		 * @default true
		 */
		details?: boolean;
		/**
		 * Collapse whitespace in `llms-small.txt`.
		 * @default true
		 */
		whitespace?: boolean;

		/**
		 * Custom selectors to exclude when generating `llms-small.txt`.
		 *
		 * @default []
		 *
		 * @example
		 * // Filter out elements with the class name `sponsors` when creating llms-small.txt
		 * customSelectors: [".sponsors"],
		 */
		customSelectors?: string[];
	};

	/**
	 * Micromatch expressions to match page IDs that should be sorted to the top of the output.
	 *
	 * @default
	 * // Note that there is not actually a space in the last expression,
	 * // removing it would close this JSDoc comment.
	 * ['index*', 'getting-started*', '!* /*']
	 */
	promote?: string[];

	/**
	 * Micromatch expressions to match page IDs that should be sorted to the end of the output.
	 *
	 * If a page matches both `promote` and `demote`, it will be demoted.
	 *
	 * @default []
	 */
	demote?: string[];

	/**
	 * Slugs of pages to exclude from `llms-small.txt`. Supports glob patterns.
	 *
	 * @default []
	 *
	 * @example
	 * // Ignore an old page and all tutorial pages when creating llms-small.txt
	 * exclude: ["old-page", "tutorial/**"],
	 */
	exclude?: string[];
}
