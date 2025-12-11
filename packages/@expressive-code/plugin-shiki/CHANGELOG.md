# @expressive-code/plugin-shiki

## 0.41.4

### Patch Changes

- @expressive-code/core@0.41.4

## 0.41.3

### Patch Changes

- Updated dependencies [eb82591]
  - @expressive-code/core@0.41.3

## 0.41.2

### Patch Changes

- @expressive-code/core@0.41.2

## 0.41.1

### Patch Changes

- Updated dependencies [a53e749]
  - @expressive-code/core@0.41.1

## 0.41.0

### Minor Changes

- 0f33477: Updates Shiki to the latest version (3.2.2).

  This adds support for the strikethrough ANSI control code, updates language grammars and adds the bundled themes `gruvbox-dark-hard`, `gruvbox-dark-medium`, `gruvbox-dark-soft`, `gruvbox-light-hard`, `gruvbox-light-medium`, and `gruvbox-light-soft`.

- 0f33477: Extends ANSI formatting support to allow background colors and strikethrough text. Thank you @dhruvkb!

### Patch Changes

- Updated dependencies [380bfcc]
- Updated dependencies [0f33477]
- Updated dependencies [6497f09]
- Updated dependencies [a826a4a]
- Updated dependencies [0f33477]
- Updated dependencies [0f33477]
  - @expressive-code/core@0.41.0

## 0.40.2

### Patch Changes

- Updated dependencies [1734d73]
  - @expressive-code/core@0.40.2

## 0.40.1

### Patch Changes

- Updated dependencies [ecf6ca1]
  - @expressive-code/core@0.40.1

## 0.40.0

### Patch Changes

- @expressive-code/core@0.40.0

## 0.39.0

### Minor Changes

- 9149332: Updates Shiki to the latest version (1.26.1).

### Patch Changes

- @expressive-code/core@0.39.0

## 0.38.3

### Patch Changes

- 90b614e: Makes the types used by the `shiki.langs` config option less strict to align them better with actual grammars found in the wild. This attempts to reduce the amount of type errors that occurred before when using external grammars, while still being supported by the language processing code.
  - @expressive-code/core@0.38.3

## 0.38.2

### Patch Changes

- @expressive-code/core@0.38.2

## 0.38.1

### Patch Changes

- Updated dependencies [440bb83]
  - @expressive-code/core@0.38.1

## 0.38.0

### Minor Changes

- 944dda0: Updates Shiki to the latest version (1.22.2).
- 944dda0: Adds new config option `shiki.injectLangsIntoNestedCodeBlocks`.

  By default, the additional languages defined in the `shiki.langs` option are only available in top-level code blocks contained directly in their parent Markdown or MDX document.

  Setting the new `shiki.injectLangsIntoNestedCodeBlocks` option to `true` also enables syntax highlighting when a fenced code block using one of your additional `langs` is nested inside an outer `markdown`, `md` or `mdx` code block. Example:

  `````md
  ````md
  This top-level Markdown code block contains a nested `my-custom-lang` code block:

  ```my-custom-lang
  This nested code block will only be highlighted using `my-custom-lang`
  if `injectLangsIntoNestedCodeBlocks` is enabled.
  ```
  ````
  `````

- 944dda0: Allows overriding bundled languages using the `shiki.langs` option. Thank you @Robot-Inventor!

  The Shiki language loading logic has been improved to allow passing custom versions of bundled languages without the risk of them being overwritten by the bundled version later.

- 944dda0: Adds on-demand Shiki language loading to speed up dev server startup and build times while simultaneously decreasing memory usage. Thank you, @fweth!

### Patch Changes

- @expressive-code/core@0.38.0

## 0.37.1

### Patch Changes

- @expressive-code/core@0.37.1

## 0.37.0

### Patch Changes

- @expressive-code/core@0.37.0

## 0.36.1

### Patch Changes

- @expressive-code/core@0.36.1

## 0.36.0

### Minor Changes

- bff1106: Adds the experimental `transformers` option to the Shiki plugin. Thank you @MichaelMakesGames!

  This option allows you to specify a list of Shiki transformers to be called during syntax highlighting.

  **Important:** This option is marked as experimental because it only supports a **very limited subset** of Shiki transformer features right now. Most importantly, transformers cannot modify a code block's text contents in any way, so most popular transformers will not work.

  In its current state, this option allows you to use transformers that solely modify the tokens produced by Shiki to improve syntax highlighting, e.g. applying bracket matching or changing the color of certain tokens.

  Attempting to pass incompatible transformers to this option will throw an error. This is not a bug, neither in Expressive Code, nor in Shiki or the transformers. Please do not report incompatibilities to other authors, as they are unable to fix them. The current limitations exist because the Shiki transformer API is incompatible with Expressive Code's architecture, and we will continue to work on closing the gap and improving this feature.

- ca54f6e: Updates Shiki dependency to the latest version.

### Patch Changes

- Updated dependencies [ca54f6e]
  - @expressive-code/core@0.36.0

## 0.35.6

### Patch Changes

- @expressive-code/core@0.35.6

## 0.35.5

### Patch Changes

- @expressive-code/core@0.35.5

## 0.35.4

### Patch Changes

- Updated dependencies [876d24c]
  - @expressive-code/core@0.35.4

## 0.35.3

### Patch Changes

- @expressive-code/core@0.35.3

## 0.35.2

### Patch Changes

- Updated dependencies [dd54846]
  - @expressive-code/core@0.35.2

## 0.35.1

### Patch Changes

- @expressive-code/core@0.35.1

## 0.35.0

### Patch Changes

- @expressive-code/core@0.35.0

## 0.34.2

### Patch Changes

- Updated dependencies [cbc16e9]
  - @expressive-code/core@0.34.2

## 0.34.1

### Patch Changes

- Updated dependencies [1b2279f]
  - @expressive-code/core@0.34.1

## 0.34.0

### Minor Changes

- b6e7167: **Potentially breaking change:** Since this version, all packages are only distributed in modern ESM format, which greatly reduces bundle size.

  Most projects should not be affected by this change at all, but in case you still need to import Expressive Code packages into a CommonJS project, you can use the widely supported `await import(...)` syntax.

### Patch Changes

- Updated dependencies [af2a10a]
- Updated dependencies [b94a91d]
- Updated dependencies [af2a10a]
- Updated dependencies [9eb8619]
- Updated dependencies [b6e7167]
- Updated dependencies [2ef2503]
- Updated dependencies [b94a91d]
  - @expressive-code/core@0.34.0

## 0.33.5

### Patch Changes

- Updated dependencies [2469749]
  - @expressive-code/core@0.33.5

## 0.33.4

### Patch Changes

- 6f26c3b: Rolls back even more plugin-shiki changes. They will be re-added later. :)
  - @expressive-code/core@0.33.4

## 0.33.3

### Patch Changes

- f15b9f4: Reverts language loading of `plugin-shiki` to the previous behavior to work around an apparent race condition.
  - @expressive-code/core@0.33.3

## 0.33.2

### Patch Changes

- a408e31: Improves error logging in case any plugin hooks fail.
- Updated dependencies [a408e31]
  - @expressive-code/core@0.33.2

## 0.33.1

### Patch Changes

- Updated dependencies [f3ac898]
  - @expressive-code/core@0.33.1

## 0.33.0

### Minor Changes

- b7a0607: Adds `metaOptions` read-only property to `ExpressiveCodeBlock` instances.

  This new property contains a parsed version of the code block's `meta` string. This allows plugins to easily access the options specified by users in the opening code fence of a code block, without having to parse the `meta` string themselves.

  All official plugins now use this new API to merge any meta options into the new extensible `ExpressiveCodeBlock.props` property.

- b7a0607: Migrates syntax highlighting back to Shiki.

  After the improvements made in Shikiji were merged back into Shiki, Expressive Code now uses Shiki again for syntax highlighting.

  **Potentially breaking:** Although we performed a lot of testing, the migration might cause slightly different highlighting in some cases, as the latest full bundle of Shiki includes various new and updated grammars. We recommend checking if syntax highlighting still looks as expected on your site.

### Patch Changes

- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
  - @expressive-code/core@0.33.0

## 0.32.4

### Patch Changes

- Updated dependencies [20e900a]
  - @expressive-code/core@0.32.4

## 0.32.3

### Patch Changes

- @expressive-code/core@0.32.3

## 0.32.2

### Patch Changes

- @expressive-code/core@0.32.2

## 0.32.1

### Patch Changes

- @expressive-code/core@0.32.1

## 0.32.0

### Patch Changes

- @expressive-code/core@0.32.0

## 0.31.0

### Patch Changes

- @expressive-code/core@0.31.0

## 0.30.2

### Patch Changes

- a9bbb5c: Fixes unexpected `InlineStyleAnnotation` behaviors to improve DX for plugin authors.

  - Inline styles now use `:where()` in selectors to reduce specificity and make them easier to override.
  - When applying multiple overlapping inline styles to the same line, render phases are now properly respected and later styles override earlier ones.
  - The `styleVariantIndex` property is no longer required. Inline styles without an index now apply to all style variants.
  - The default `InlineStyleAnnotation` render phase is now `normal`. The previous default setting `earliest` is now explicitly applied by `plugin-shiki` instead. This improves the API while still rendering syntax highlighting in the `earliest` phase to allow other annotations to wrap and modify the highlighted code.

- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
  - @expressive-code/core@0.30.2

## 0.30.1

### Patch Changes

- c3758cd: Fixes parallel execution of multiple syntax highlighter creations and tasks.

  The Shiki plugin now ensures that async tasks like creating syntax highlighters, loading themes or languages are never started multiple times in parallel. This improves performance, reduces memory usage and prevents build errors on large sites.

  - @expressive-code/core@0.30.1

## 0.30.0

### Minor Changes

- 05c6ad8: Changes the syntax highlighter used by `plugin-shiki` to Shikiji. Adds a `shiki: { langs: [...] }` option for loading custom languages.

  This change should not cause any differences in HTML output as all rendering is done by Expressive Code. The new `langs` option allows registering custom TextMate grammars in JSON form.

### Patch Changes

- @expressive-code/core@0.30.0

## 0.29.4

### Patch Changes

- 765dd00: Unknown code block languages now log a warning and render as plaintext instead of throwing an error.
- Updated dependencies [765dd00]
- Updated dependencies [765dd00]
  - @expressive-code/core@0.29.4

## 0.29.3

### Patch Changes

- @expressive-code/core@0.29.3

## 0.29.2

### Patch Changes

- @expressive-code/core@0.29.2

## 0.29.1

### Patch Changes

- @expressive-code/core@0.29.1

## 0.29.0

### Patch Changes

- Updated dependencies [85dbab8]
  - @expressive-code/core@0.29.0

## 0.28.2

### Patch Changes

- @expressive-code/core@0.28.2

## 0.28.1

### Patch Changes

- @expressive-code/core@0.28.1

## 0.28.0

### Patch Changes

- @expressive-code/core@0.28.0

## 0.27.1

### Patch Changes

- @expressive-code/core@0.27.1

## 0.27.0

### Minor Changes

- f19746b: Rendering multiple themes no longer generates duplicate CSS and HTML output.

  In previous versions, a full set of CSS styles was generated for each individual theme, and each code block was rendered multiple times to include the HTML for each theme.

  In this version, the CSS output has been changed to a single static set of base styles that uses CSS variables to allow efficient switching between themes.

  Also, the HTML output for code blocks is now generated only once, and theme-dependent styles are applied using CSS variables.

  These changes significantly reduce page size when using multiple themes, especially on pages with many code blocks.

  If you have added CSS code to your site that relies on the old output (e.g. by selectively hiding or showing theme-specific code blocks based on their class name), you will need to update it to work with the new output.

  > **Note**: Before writing new custom CSS, please consider if you can achieve your desired result out of the box now. For example, if your `themes` option contains one dark and one light theme, the `useDarkModeMediaQuery` option will generate a `prefers-color-scheme` media query for you by default.

### Patch Changes

- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
  - @expressive-code/core@0.27.0

## 0.26.2

### Patch Changes

- @expressive-code/core@0.26.2

## 0.26.1

### Patch Changes

- @expressive-code/core@0.26.1

## 0.26.0

### Patch Changes

- ef93adf: Improves caching logic to respect theme contents in addition to name.
- Updated dependencies [d2277ba]
- Updated dependencies [d2277ba]
  - @expressive-code/core@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - @expressive-code/core@0.25.0

## 0.24.0

### Patch Changes

- af3171b: Passes global `styleOverrides` to plugin style resolver functions.

  This allows plugins to access their individual `styleOverrides` extensions even when values were defined at the global config level.

- Updated dependencies [af3171b]
- Updated dependencies [2c375b1]
  - @expressive-code/core@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
  - @expressive-code/core@0.23.0

## 0.22.2

### Patch Changes

- @expressive-code/core@0.22.2

## 0.22.1

### Patch Changes

- @expressive-code/core@0.22.1

## 0.22.0

### Patch Changes

- @expressive-code/core@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [becc145]
  - @expressive-code/core@0.21.0

## 0.20.0

### Patch Changes

- @expressive-code/core@0.20.0

## 0.19.2

### Patch Changes

- @expressive-code/core@0.19.2

## 0.19.1

### Patch Changes

- @expressive-code/core@0.19.1

## 0.19.0

### Patch Changes

- @expressive-code/core@0.19.0

## 0.18.1

### Patch Changes

- @expressive-code/core@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Adds support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- @expressive-code/core@0.18.0

## 0.17.0

### Patch Changes

- @expressive-code/core@0.17.0

## 0.16.0

### Patch Changes

- @expressive-code/core@0.16.0

## 0.15.0

### Minor Changes

- Synchronizes package versions to prevent future dependency issues.

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.15.0

## 0.3.9

### Patch Changes

- Updated dependencies [f98937c]
  - @expressive-code/core@0.11.0

## 0.3.8

### Patch Changes

- Updated dependencies [276d221]
  - @expressive-code/core@0.10.0

## 0.3.7

### Patch Changes

- Updated dependencies [5da8685]
  - @expressive-code/core@0.9.0

## 0.3.6

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.8.0

## 0.3.5

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.7.0

## 0.3.4

### Patch Changes

- Updated dependencies [f8ed803]
  - @expressive-code/core@0.6.0

## 0.3.3

### Patch Changes

- Updated dependencies [af207b0]
  - @expressive-code/core@0.5.0

## 0.3.2

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.4.0

## 0.3.1

### Patch Changes

- Turns off explanations to improve Shiki performance.

## 0.3.0

### Minor Changes

- 3ffa599: Fixes incorrect highlighting of terminal placeholders.

### Patch Changes

- Updated dependencies [6d316f6]
  - @expressive-code/core@0.3.0

## 0.2.1

### Patch Changes

- Makes `@internal/test-utils` a dev dependency as intended.

## 0.2.0

### Minor Changes

- Initial release.

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.2.0
  - @internal/test-utils@0.1.1
