# @expressive-code/plugin-collapsible-sections

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

- 380bfcc: Adds new `createInlineSvgUrl` export that creates an inline SVG image data URL from the given contents of an SVG file.

  You can use it to embed SVG images directly into a plugin's styles or HAST, or pass it to an existing `styleOverrides` icon setting.

- 380bfcc: Adds the following new `styleOverrides` settings:

  - `collapsibleSections.expandIcon` and `collapsibleSections.collapseIcon`: Allows overriding the SVG icons used for the expand/collapse buttons.

- 6497f09: Uses the new `preventUnitlessValues` property of `PluginStyleSettings` to make style calculations in the plugins "Collapsible Sections", "Frames" and "Text Markers" more robust.

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

### Minor Changes

- 4eed5d0: Adds new `collapseStyle` prop to `@expressive-code/plugin-collapsible-sections`. Thank you @nerdymomocat!

  The new prop allows selecting one of the following collapsible section styles:

  - `github`: The default style, similar to the one used by GitHub. A summary line with an expand icon and the default text `X collapsed lines` is shown. When expanded, the summary line is replaced by the section's code lines. It is not possible to re-collapse the section.
  - `collapsible-start`: When collapsed, the summary line looks like the `github` style. However, when expanded, it remains visible above the expanded code lines, making it possible to re-collapse the section.
  - `collapsible-end`: Same as `collapsible-start`, but the summary line remains visible below the expanded code lines.
  - `collapsible-auto`: Automatically selects `collapsible-start` or `collapsible-end` based on the location of the collapsible section in the code block. Uses `collapsible-start` unless the section ends at the bottom of the code block, in which case `collapsible-end` is used.

### Patch Changes

- @expressive-code/core@0.40.0

## 0.39.0

### Patch Changes

- @expressive-code/core@0.39.0

## 0.38.3

### Patch Changes

- @expressive-code/core@0.38.3

## 0.38.2

### Patch Changes

- @expressive-code/core@0.38.2

## 0.38.1

### Patch Changes

- 440bb83: Fixes invalid CSS file links when using the `Code` component together with `plugin-collapsible-sections` and `pnpm`. Thank you @simonporter007 and @ayZagen for the report!
- Updated dependencies [440bb83]
  - @expressive-code/core@0.38.1

## 0.38.0

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

- b94a91d: Updates dependencies `hast`, `hastscript` and `hast-util-*` to the latest versions.

  **Potentially breaking change:** Unfortunately, some of the new `hast` types are incompatible with their old versions. If you created custom plugins to manipulate HAST nodes, you may need to update your dependencies as well and probably change some types. For example, if you were using the `Parent` type before, you will probably need to replace it with `Parents` or `Element` in the new version.

- b94a91d: Adds a new `/hast` entrypoint to `@expressive-code/core`, `expressive-code`, `remark-expressive-code` and `astro-expressive-code` to simplify plugin development.

  This new entrypoint provides direct access to the correct versions of HAST types and commonly used tree traversal, querying and manipulation functions. Instead of having to add your own dependencies on libraries like `hastscript`, `hast-util-select` or `unist-util-visit` to your project and manually keeping them in sync with the versions used by Expressive Code, you can now import the internally used functions and types directly from this new entrypoint.

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

- @expressive-code/core@0.33.4

## 0.33.3

### Patch Changes

- @expressive-code/core@0.33.3

## 0.33.2

### Patch Changes

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

- b7a0607: Adds new `collapsePreserveIndent` prop to `@expressive-code/plugin-collapsible-sections` and replaces `styleOverrides` property `closedPadding` with `closedPaddingBlock`.

  The new prop determines if collapsed section titles (`X collapsed lines`) should be indented to preserve the minimum indent level of their contained collapsed code lines. This allows collapsed sections to integrate better with the surrounding code. Defaults to `true`.

  **Breaking change:** If you used the `styleOverrides` property `closedPadding` before to change the default padding around closed collapsed section headings, you must now use `closedPaddingBlock` instead. While the old property supported specifying paddings for all four sides, the new property only supports paddings in the block direction (top and bottom in horizontal writing mode). This change was necessary to make collapsed sections compatible with line wrapping and gutter elements.

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

- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
  - @expressive-code/core@0.30.2

## 0.30.1

### Patch Changes

- @expressive-code/core@0.30.1

## 0.30.0

### Patch Changes

- @expressive-code/core@0.30.0

## 0.29.4

### Patch Changes

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

- cf01e1e: Fixes missing `styleOverrides.collapsibleSections` declaration even after importing `@expressive-code/plugin-collapsible-sections`. Thanks @fflaten!
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

- f19746b: Moves all plugin styles into nested sub-objects of top-level config option `styleOverrides`.

  In previous versions, there could be multiple `styleOverrides` scattered through the configuration (one per plugin with configurable style settings). This has been simplified to a single top-level `styleOverrides` object that contains all style overrides.

  Plugins can contribute their own style settings to this object as well by nesting them inside under their plugin name.

  ```diff lang="js"
    /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
    const remarkExpressiveCodeOptions = {
      frames: {
        showCopyToClipboardButton: false,
  -     styleOverrides: {
  -       shadowColor: '#124',
  -     },
      },
  +   styleOverrides: {
  +     frames: {
  +       shadowColor: '#124',
  +     },
  +     // You could override other plugin styles here as well:
  +     // textMarkers: { ... },
  +   },
    },
  ```

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

- Updated dependencies [d2277ba]
- Updated dependencies [d2277ba]
  - @expressive-code/core@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - @expressive-code/core@0.25.0

## 0.24.0

### Minor Changes

- 2c375b1: Migrates i18n functions to string templates with plural support.

  Translated texts including dynamic parts (e.g. a line count) previously used a function syntax. This was convenient to use during plugin development, but made it impossible to use the popular JSON file format as a source of translated texts. To make it easier to integrate Expressive Code, this release gets rid of the function syntax and adds a `formatTemplate` function that understands a simple string template syntax including placeholders and plural support.

  Simple placeholders are written as variable names in curly brackets, e.g. `{variableName}`.

  You can also use conditional placeholders by separating multiple choices with semicolons and optionally adding a condition before each choice, e.g. `{itemCount;1=item;items}` or `{variableName; 0=zero; >0=positive; negative}`.

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

- 1916338: Hides summary marker on Safari for collapsible section.
  - @expressive-code/core@0.22.2

## 0.22.1

### Patch Changes

- 401b61a: Fixes shifted collapsible sections when other plugins add or remove lines.
  - @expressive-code/core@0.22.1

## 0.22.0

### Minor Changes

- 0f5258b: Implements the plugin-collapsible-sections plugin, which adds support for collapsed sections of code. These sections hide a number of code lines until the user chooses to expand them. Thanks @birjj for the contribution!

### Patch Changes

- @expressive-code/core@0.22.0
