# @expressive-code/plugin-collapsible-sections

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

- cf01e1e: Fix missing `styleOverrides.collapsibleSections` declaration even after importing `@expressive-code/plugin-collapsible-sections`. Thanks @fflaten!
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

- f19746b: Move all plugin styles into nested sub-objects of top-level config option `styleOverrides`.

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

- 2c375b1: Migrate i18n functions to string templates with plural support.

  Translated texts including dynamic parts (e.g. a line count) previously used a function syntax. This was convenient to use during plugin development, but made it impossible to use the popular JSON file format as a source of translated texts. To make it easier to integrate Expressive Code, this release gets rid of the function syntax and adds a `formatTemplate` function that understands a simple string template syntax including placeholders and plural support.

  Simple placeholders are written as variable names in curly brackets, e.g. `{variableName}`.

  You can also use conditional placeholders by separating multiple choices with semicolons and optionally adding a condition before each choice, e.g. `{itemCount;1=item;items}` or `{variableName; 0=zero; >0=positive; negative}`.

### Patch Changes

- af3171b: Pass global `styleOverrides` to plugin style resolver functions.

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

- 1916338: Hide summary marker on Safari for collapsible section
  - @expressive-code/core@0.22.2

## 0.22.1

### Patch Changes

- 401b61a: Fix shifted collapsible sections when other plugins add or remove lines
  - @expressive-code/core@0.22.1

## 0.22.0

### Minor Changes

- 0f5258b: Implements the plugin-collapsible-sections plugin, which adds support for collapsed sections of code. These sections hide a number of code lines until the user chooses to expand them. Thanks @birjj for the contribution!

### Patch Changes

- @expressive-code/core@0.22.0
