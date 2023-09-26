# astro-expressive-code

## 0.26.1

### Patch Changes

- 3e0e8c4: Re-initialize copy to clipboard buttons after Astro view transitions.
  - remark-expressive-code@0.26.1

## 0.26.0

### Minor Changes

- d2277ba: Themed selection now keeps the code foreground color intact (like VS Code).

  Color overlays no longer prevent text from being selectable.

### Patch Changes

- Updated dependencies [d2277ba]
  - remark-expressive-code@0.26.0

## 0.25.0

### Minor Changes

- 126563e: Improve theme loading by allowing to pass more theme types directly.

  The `theme` config option now supports the following value types:

  - any theme object compatible with VS Code or Shiki (e.g. imported from an NPM theme package)
  - any ExpressiveCodeTheme instance (e.g. using `ExpressiveCodeTheme.fromJSONString(...)`
    to load a custom JSON/JSONC theme file yourself)
  - if you are using a higher-level integration like `remark-expressive-code` or `astro-expressive-code`:
    - any theme name bundled with Shiki (e.g. `dracula`)
  - any combination of the above in an array

- 126563e: Add more colors to `ExpressiveCodeTheme.applyHueAndChromaAdjustments`, allow chaining.

  The `applyHueAndChromaAdjustments()` function now also adjusts `titleBar.activeBackground` and `titleBar.border` properly. Also, it returns the `ExpressiveCodeTheme` instance to allow chaining.

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - remark-expressive-code@0.25.0

## 0.24.0

### Minor Changes

- af3171b: Render frame borders on top of background, add `editorActiveTabHighlightHeight` style setting.

  Previously, borders were rendered around the editor / terminal window, which could lead to unwanted empty margins between the window background and the drop shadow (e.g. in theme `nord`). Now, the border is rendered on top of the background to resolve this issue, making fully transparent borders act like padding instead.

  Additionally, the `editorActiveTabHighlightHeight` style setting was introduced, which allows customizing the colorful line that highlights the active editor tab. It defaults to `borderWidth`.

### Patch Changes

- af3171b: Pass global `styleOverrides` to plugin style resolver functions.

  This allows plugins to access their individual `styleOverrides` extensions even when values were defined at the global config level.

- Updated dependencies [af3171b]
- Updated dependencies [af3171b]
  - remark-expressive-code@0.24.0

## 0.23.0

### Minor Changes

- bfed62a: Add config option `customizeTheme`.

  This optional function is called once per theme during engine initialization with the loaded theme as its only argument.

  It allows customizing the loaded theme and can be used for various purposes:

  - You can change a theme's `name` property to influence its generated CSS class name (e.g. `theme.name = 'dark'` will result in code blocks having the class `ec-theme-dark`).
  - You can create color variations of themes by using `theme.applyHueAndChromaAdjustments()`.

- bfed62a: Add plugin styles to the `styleOverrides` config option.

  So far, this object only contained core styles like colors, fonts, paddings and more. Now, plugins also contribute their own style settings to this object.

  For example, if the `frames` plugin is installed, you can now override its `shadowColor` by setting `styleOverrides.frames.shadowColor` to a color value.

- bfed62a: Add `applyHueAndChromaAdjustments` function to `ExpressiveCodeTheme`.

  You can now apply chromatic adjustments to entire groups of theme colors while keeping their relative lightness and alpha components intact. This can be used to quickly create theme variants that fit the color scheme of any website or brand.

  Adjustments can either be defined as hue and chroma values in the OKLCH color space (range 0–360 for hue, 0–0.4 for chroma), or these values can be extracted from hex color strings (e.g. `#3b82f6`).

  You can target predefined groups of theme colors (e.g. `backgrounds`, `accents`) and/or use the `custom` property to define your own groups of theme colors to be adjusted.

- bfed62a: Add outer wrapper when rendering multiple themes.

  When the `theme` option is set to an array containing multiple themes, the rendered code block groups are now wrapped inside `<div class="ec-themes-wrapper">...</div>`. This encapsulates all rendered themes in a single element and thereby ensures their consistent positioning on sites that would otherwise add margins between them due to adjacent sibling combinators.

- bfed62a: Add `styleOverrides` to `ExpressiveCodeTheme`.

  Themes can now provide their own `styleOverrides`, which take precedence over global `styleOverrides` and the default styles.

### Patch Changes

- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
  - remark-expressive-code@0.23.0

## 0.22.2

### Patch Changes

- remark-expressive-code@0.22.2

## 0.22.1

### Patch Changes

- remark-expressive-code@0.22.1

## 0.22.0

### Patch Changes

- remark-expressive-code@0.22.0

## 0.21.0

### Minor Changes

- becc145: Add multi-theme support to the `theme` config option.

  You can now pass an array of themes to the `theme` config option of `remark-expressive-code` and `astro-expressive-code`.

  This allows you to render each code block in your markdown/MDX documents using multiple themes, e.g. to support light and dark modes on your site.

  **Note**: If you use this feature, you will also need to add custom CSS code to your site to ensure that only one theme is visible at any time.

  To allow targeting all code blocks of a given theme through CSS, the theme property `name` is used to generate kebap-cased class names in the format `ec-theme-${name}`. For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice, once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.

### Patch Changes

- Updated dependencies [becc145]
  - remark-expressive-code@0.21.0

## 0.20.0

### Minor Changes

- 7c5c3c7: Add `removeCommentsWhenCopyingTerminalFrames` config option to `plugin-frames`. Thanks @AkashRajpurohit!

  If `true` (which is the default), the "Copy to clipboard" button of terminal window frames will remove comment lines starting with `#` from the copied text.

  This is useful to reduce the copied text to the actual commands users need to run, instead of also copying explanatory comments or instructions.

### Patch Changes

- Updated dependencies [7c5c3c7]
  - remark-expressive-code@0.20.0

## 0.19.2

### Patch Changes

- f39ac56: Add support for Astro 3.0.0 incl. prereleases
  - remark-expressive-code@0.19.2

## 0.19.1

### Patch Changes

- remark-expressive-code@0.19.1

## 0.19.0

### Minor Changes

- f95d3f1: Add support for `diff`-like syntax and `lang` meta attribute. Thanks for the idea @hirasso!

  To mark lines as inserted or deleted, you can now use the widely supported `diff` language as an alternative to adding line numbers to the opening code fence.

  You can even specify a separate syntax highlighting language by adding a `lang="..."` attribute to the opening fence. See [README.md](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md) for more details.

### Patch Changes

- Updated dependencies [f95d3f1]
  - remark-expressive-code@0.19.0

## 0.18.1

### Patch Changes

- remark-expressive-code@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Add support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- Updated dependencies [4e26180]
  - remark-expressive-code@0.18.0

## 0.17.0

### Patch Changes

- remark-expressive-code@0.17.0

## 0.16.0

### Minor Changes

- 07012f7: Improve file type support when extracting file names from comments. Thanks @fflaten!

  - Adds more file types to the `LanguageGroups` object
  - Exports `LanguageGroups` to allow external modification
  - Extends automatic detection of frame type to differentiate between shell scripts and terminal sessions based on file name and/or shebang (if any)

### Patch Changes

- Updated dependencies [07012f7]
  - remark-expressive-code@0.16.0

## 0.15.0

### Minor Changes

- Synchronize package versions to prevent future dependency issues

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.15.0

## 0.14.0

### Minor Changes

- aa8f09d: Add support to override frame types per code block. Thanks @Princesseuh!

  By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

  You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

  The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.

### Patch Changes

- Updated dependencies [aa8f09d]
  - remark-expressive-code@0.14.0

## 0.13.0

### Minor Changes

- f98937c: Add config options `useThemedScrollbars` and `useThemedSelectionColors`. Thanks @Princesseuh!

  Both options default to `true`. Set any of them to `false` to prevent themes from customizing their appearance and render them using the browser's default style.

### Patch Changes

- Updated dependencies [f98937c]
  - remark-expressive-code@0.13.0

## 0.12.2

### Patch Changes

- 66de505: Fix non-working copy buttons in dynamically loaded content
- Updated dependencies [66de505]
  - remark-expressive-code@0.12.2

## 0.12.1

### Patch Changes

- Make marked text selectable (#15). Thanks @hirasso!
- Updated dependencies
  - remark-expressive-code@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [e010774]
  - remark-expressive-code@0.12.0

## 0.11.0

### Minor Changes

- 599db8a: Add default export for `astro add` support

### Patch Changes

- remark-expressive-code@0.11.0

## 0.10.0

### Minor Changes

- 5da8685: Add RTL support (ensure that code lines are always LTR)

### Patch Changes

- Updated dependencies [5da8685]
  - remark-expressive-code@0.10.0

## 0.9.1

### Patch Changes

- Enable stricter TypeScript checks (exactOptionalPropertyTypes), improve types
- Updated dependencies
  - remark-expressive-code@0.9.1

## 0.9.0

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.9.0

## 0.8.4

### Patch Changes

- remark-expressive-code@0.8.4

## 0.8.3

### Patch Changes

- remark-expressive-code@0.8.3

## 0.8.2

### Patch Changes

- remark-expressive-code@0.8.2

## 0.8.1

### Patch Changes

- Make `astro` peer dependency more tolerant
  - remark-expressive-code@0.8.1

## 0.8.0

### Minor Changes

- f8ed803: Add support for localized texts, add German to frames plugin

### Patch Changes

- Updated dependencies [f8ed803]
  - remark-expressive-code@0.8.0

## 0.7.0

### Minor Changes

- First working version of Astro integration

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [af207b0]
  - remark-expressive-code@0.6.0

## 0.5.0

### Patch Changes

- remark-expressive-code@0.5.0

## 0.4.2

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.4.2

## 0.4.1

### Patch Changes

- Fix issues with color transforms
- Updated dependencies
  - remark-expressive-code@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [b6833ef]
  - remark-expressive-code@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.3.0

## 0.2.0

### Minor Changes

- Initial release

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.2.0
