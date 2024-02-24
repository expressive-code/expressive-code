# remark-expressive-code

## 0.33.4

### Patch Changes

- expressive-code@0.33.4

## 0.33.3

### Patch Changes

- f15b9f4: Reverts language loading of `plugin-shiki` to the previous behavior to work around an apparent race condition.
- Updated dependencies [f15b9f4]
  - expressive-code@0.33.3

## 0.33.2

### Patch Changes

- expressive-code@0.33.2

## 0.33.1

### Patch Changes

- f3ac898: Fixes an issue where lines containing a very long word after the initial indentation would wrap incorrectly.
- Updated dependencies [f3ac898]
  - expressive-code@0.33.1

## 0.33.0

### Minor Changes

- b7a0607: Adds word wrap support to all Expressive Code blocks.

  By setting the new `wrap` prop to `true` (either in the opening code fence, as a prop on the `<Code>` component, or in the `defaultProps` config option), word wrapping will be enabled, causing lines that exceed the available width to wrap to the next line. The default value of `false` will instead cause a horizontal scrollbar to appear in such cases.

  The word wrap behavior can be further customized using the new `preserveIndent` prop. If `true` (which is the default), wrapped parts of long lines will be aligned with their line's indentation level, making the wrapped code appear to start at the same column. This increases readability of the wrapped code and can be especially useful for languages where indentation is significant, e.g. Python.

  If you prefer wrapped parts of long lines to always start at column 1, you can set `preserveIndent` to `false`. This can be useful to reproduce terminal output.

- b7a0607: Adds a new gutter API that allows plugins to render gutter elements before code lines.

  Using the new `addGutterElement` API accessible through the hook context argument, plugins can add gutter elements to a code block. The function expects an object matching the new `GutterElement` interface.

  During rendering, the engine calls the `renderLine` function of the gutter elements registered by all plugins for every line of the code block. The returned elements are then added as children to the line's gutter container.

  **Potentially breaking change:** To properly support all combinations of gutter elements and line wrapping, the rendered HTML tree of code blocks had to be changed. The code contents of each line are now wrapped inside an extra `<div class="code">...</div>` element:

  ```diff lang="html"
    <div class="ec-line">
  +   <div class="code">
        <span style="...">contents</span>
        [...more contents...]
  +   </div>
    </div>
  ```

  If gutter elements were added to a code block, an optional `<div class="gutter">...</div>` will be rendered before this new code wrapper:

  ```diff lang="html"
    <div class="ec-line">
  +   <div class="gutter">
  +     [...gutter elements...]
  +   </div>
      <div class="code">
        <span style="...">contents</span>
        [...more contents...]
      </div>
    </div>
  ```

- b7a0607: Adds `ExpressiveCodeBlock.props` property and `defaultProps` config option.

  The underlying `ExpressiveCodeBlockProps` interface provides a type-safe way for plugins to extend Expressive Code with their own props using declaration merging. Plugins should use the `preprocessMetadata` hook to merge options specified in the opening code fence into their props, making `props` the single source of truth for all per-block options.

  In addition, the new `defaultProps` config option allows you to specify default props that will automatically be set on all fenced code blocks and `<Code>` components by the engine. This saves you from having to specify the same props on every block, while still allowing to override them on an individual basis.

  The `defaultProps` option also supports an `overridesByLang` property, which allows to override the default props for a specific syntax higlighting language.

- b7a0607: Adds `metaOptions` read-only property to `ExpressiveCodeBlock` instances.

  This new property contains a parsed version of the code block's `meta` string. This allows plugins to easily access the options specified by users in the opening code fence of a code block, without having to parse the `meta` string themselves.

  All official plugins now use this new API to merge any meta options into the new extensible `ExpressiveCodeBlock.props` property.

- b7a0607: Migrates syntax highlighting back to Shiki.

  After the improvements made in Shikiji were merged back into Shiki, Expressive Code now uses Shiki again for syntax highlighting.

  **Potentially breaking:** Although we performed a lot of testing, the migration might cause slightly different highlighting in some cases, as the latest full bundle of Shiki includes various new and updated grammars. We recommend checking if syntax highlighting still looks as expected on your site.

### Patch Changes

- expressive-code@0.33.0

## 0.32.4

### Patch Changes

- 20e900a: Improves automatic color contrast correction when using CSS variables in styleOverrides. Thanks @heycassidy!

  It is now possible to use CSS variables in the `styleOverrides` setting `codeBackground` without negatively affecting the automatic color contrast correction controlled by the `minSyntaxHighlightingColorContrast` setting. If a CSS variable is encountered that cannot be resolved to a color value on the server, Expressive Code now automatically uses the theme's background color as a fallback for color contrast calculations. You can also provide your own fallback color using the CSS variable fallback syntax, e.g. `var(--gray-50, #f9fafb)`.

- Updated dependencies [20e900a]
  - expressive-code@0.32.4

## 0.32.3

### Patch Changes

- expressive-code@0.32.3

## 0.32.2

### Patch Changes

- expressive-code@0.32.2

## 0.32.1

### Patch Changes

- expressive-code@0.32.1

## 0.32.0

### Patch Changes

- expressive-code@0.32.0

## 0.31.0

### Minor Changes

- 60eb02a: It is now possible to add text labels to marked lines. Thanks @bdenham!

  The label text is rendered inside a colorful box in the first line of the marked range. This allows you to reference specific parts of your code in the surrounding text.

  To add any text as a label, enclose it in single or double quotes and add it directly after the opening curly brace, followed by a colon (`:`). For example, `ins={"A":6-10}` would mark lines 6 to 10 as inserted and add the label `A` to them.

### Patch Changes

- Updated dependencies [60eb02a]
  - expressive-code@0.31.0

## 0.30.2

### Patch Changes

- a9bbb5c: Fixes missing CSS output for `uiFontWeight` and `codeFontWeight` style settings. Changed font weights are now properly respected. Thank you @depatchedmode!
- 1a3ae04: Individual code blocks can now be switched to the base theme while an alternate theme is selected on the page level.

  Expressive Code differentiates between your base theme (= the first theme in `themes`) and your alternate themes (= any other entries in `themes`). Previously, as soon as an alternate theme was selected on the page level, e.g. by using `<html data-theme="some-theme-name">`, it wasn't possible to switch individual code blocks to the base theme anymore because of selector specificity issues. This has been resolved and block-level overrides should work as expected now.

- a9bbb5c: Fixes unexpected `InlineStyleAnnotation` behaviors to improve DX for plugin authors.

  - Inline styles now use `:where()` in selectors to reduce specificity and make them easier to override.
  - When applying multiple overlapping inline styles to the same line, render phases are now properly respected and later styles override earlier ones.
  - The `styleVariantIndex` property is no longer required. Inline styles without an index now apply to all style variants.
  - The default `InlineStyleAnnotation` render phase is now `normal`. The previous default setting `earliest` is now explicitly applied by `plugin-shiki` instead. This improves the API while still rendering syntax highlighting in the `earliest` phase to allow other annotations to wrap and modify the highlighted code.

- 1a3ae04: Themes that use transparency in unexpected places (e.g. the `rose-pine` themes) are now displayed correctly.
- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
  - expressive-code@0.30.2

## 0.30.1

### Patch Changes

- c3758cd: Fixes parallel execution of multiple syntax highlighter creations and tasks.

  The Shiki plugin now ensures that async tasks like creating syntax highlighters, loading themes or languages are never started multiple times in parallel. This improves performance, reduces memory usage and prevents build errors on large sites.

- Updated dependencies [c3758cd]
  - expressive-code@0.30.1

## 0.30.0

### Minor Changes

- 05c6ad8: Changes the syntax highlighter used by `plugin-shiki` to Shikiji. Adds a `shiki: { langs: [...] }` option for loading custom languages.

  This change should not cause any differences in HTML output as all rendering is done by Expressive Code. The new `langs` option allows registering custom TextMate grammars in JSON form.

### Patch Changes

- Updated dependencies [05c6ad8]
  - expressive-code@0.30.0

## 0.29.4

### Patch Changes

- 765dd00: Unknown code block languages now log a warning and render as plaintext instead of throwing an error.
- 765dd00: Adds the config option `useStyleReset`.

  This option determines if code blocks should be protected against influence from site-wide styles. This protection was always enabled before this release and could not be turned off.

  When enabled, Expressive Code uses the declaration `all: revert` to revert all CSS properties to the values they would have had without any site-wide styles. This ensures the most predictable results out of the box.

  You can now set this to `false` if you want your site-wide styles to influence the code blocks.

- Updated dependencies [765dd00]
- Updated dependencies [765dd00]
  - expressive-code@0.29.4

## 0.29.3

### Patch Changes

- expressive-code@0.29.3

## 0.29.2

### Patch Changes

- e18c69d: Comments like `// ...` are now no longer incorrectly detected as file names. Thanks @kdheepak!
- Updated dependencies [e18c69d]
  - expressive-code@0.29.2

## 0.29.1

### Patch Changes

- expressive-code@0.29.1

## 0.29.0

### Minor Changes

- 85dbab8: Update default fonts to match Tailwind CSS.

  The previous set of default fonts could result in very thin character line widths on iOS devices. This is now fixed by using the same widely tested set of fonts that Tailwind CSS uses.

- e020b64: Clean up frontmatter after file name comment extraction.

  If a file name comment gets extracted from a code block without a `title` attribute, additional cleanup work is now performed on the surrounding lines:

  - If the code block's language supports frontmatter, and the comment was located in a frontmatter block that has now become empty, the empty frontmatter block gets removed.
  - If the line following the removed comment (or removed frontmatter block) is empty, it gets removed as well.

### Patch Changes

- Updated dependencies [85dbab8]
- Updated dependencies [e020b64]
  - expressive-code@0.29.0

## 0.28.2

### Patch Changes

- expressive-code@0.28.2

## 0.28.1

### Patch Changes

- expressive-code@0.28.1

## 0.28.0

### Patch Changes

- expressive-code@0.28.0

## 0.27.1

### Patch Changes

- expressive-code@0.27.1

## 0.27.0

### Minor Changes

- f19746b: Add `useDarkModeMediaQuery` config option.

  This new option determines if CSS code is generated that uses a `prefers-color-scheme` media query to automatically switch between light and dark themes based on the user's system preferences.

  Defaults to `true` if your `themes` option is set to one dark and one light theme (which is the default), and `false` otherwise.

- f19746b: Rendering multiple themes no longer generates duplicate CSS and HTML output.

  In previous versions, a full set of CSS styles was generated for each individual theme, and each code block was rendered multiple times to include the HTML for each theme.

  In this version, the CSS output has been changed to a single static set of base styles that uses CSS variables to allow efficient switching between themes.

  Also, the HTML output for code blocks is now generated only once, and theme-dependent styles are applied using CSS variables.

  These changes significantly reduce page size when using multiple themes, especially on pages with many code blocks.

  If you have added CSS code to your site that relies on the old output (e.g. by selectively hiding or showing theme-specific code blocks based on their class name), you will need to update it to work with the new output.

  > **Note**: Before writing new custom CSS, please consider if you can achieve your desired result out of the box now. For example, if your `themes` option contains one dark and one light theme, the `useDarkModeMediaQuery` option will generate a `prefers-color-scheme` media query for you by default.

- f19746b: Add `minSyntaxHighlightingColorContrast` config option.

  This new option determines if Expressive Code should process the syntax highlighting colors of all themes to ensure an accessible minimum contrast ratio between foreground and background colors.

  Defaults to `5.5`, which ensures a contrast ratio of at least 5.5:1. You can change the desired contrast ratio by providing another value, or turn the feature off by setting this option to `0`.

- f19746b: Config option `textMarkers` can no longer be an object.

  In previous versions, the `textMarkers` config option could be an object containing plugin options. This is no longer supported, as the only option that was available (`styleOverrides`) has been nested into the top-level `styleOverrides` object now.

  ```diff lang="js"
    /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
    const remarkExpressiveCodeOptions = {
  -   textMarkers: {
  -     styleOverrides: {
  -       markHue: '310',
  -     },
  -   },
  +   styleOverrides: {
  +     textMarkers: {
  +       markHue: '310',
  +     },
  +     // You could override other plugin styles here as well:
  +     // frames: { ... },
  +   },
    },
  ```

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

- f19746b: Rename config option `theme` to `themes`.

  Efficient multi-theme support using CSS variables is now a core feature, so the `theme` option was deprecated in favor of the new array `themes`.

  Please migrate your existing config to use `themes` and ensure it is an array. If you only need a single theme, your `themes` array can contain just this one theme. However, please consider the benefits of providing multiple themes.

  ```diff lang="js"
    /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
    const remarkExpressiveCodeOptions = {
  -   theme: 'dracula',
  +   // Rename to `themes` and ensure it is an array
  +   // (also consider adding a light theme for accessibility)
  +   themes: ['dracula'],
    },
  ```

- f19746b: Add `cascadeLayer` config option.

  This new option allows to specify a CSS cascade layer name that should be used for all generated CSS styles.

  If you are using [cascade layers](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_layers) on your site to control the order in which CSS rules are applied, set this option to a non-empty string, and Expressive Code will wrap all of its generated CSS styles in a `@layer` rule with the given name.

### Patch Changes

- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
  - expressive-code@0.27.0

## 0.26.2

### Patch Changes

- f2e6b81: Fix multiple different inline marker types on the same line. Thanks @7c78!

  The logic inside `flattenInlineMarkerRanges` had a flaw that caused various combinations of `mark`, `ins` and `del` inline markers on the same line to fail. This was fixed and more tests were added.

- Updated dependencies [f2e6b81]
  - expressive-code@0.26.2

## 0.26.1

### Patch Changes

- expressive-code@0.26.1

## 0.26.0

### Minor Changes

- d2277ba: Themed selection now keeps the code foreground color intact (like VS Code).

  Color overlays no longer prevent text from being selectable.

### Patch Changes

- Updated dependencies [d2277ba]
  - expressive-code@0.26.0

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

- expressive-code@0.25.0

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
  - expressive-code@0.24.0

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

- expressive-code@0.23.0

## 0.22.2

### Patch Changes

- expressive-code@0.22.2

## 0.22.1

### Patch Changes

- expressive-code@0.22.1

## 0.22.0

### Patch Changes

- expressive-code@0.22.0

## 0.21.0

### Minor Changes

- becc145: Add multi-theme support to the `theme` config option.

  You can now pass an array of themes to the `theme` config option of `remark-expressive-code` and `astro-expressive-code`.

  This allows you to render each code block in your markdown/MDX documents using multiple themes, e.g. to support light and dark modes on your site.

  **Note**: If you use this feature, you will also need to add custom CSS code to your site to ensure that only one theme is visible at any time.

  To allow targeting all code blocks of a given theme through CSS, the theme property `name` is used to generate kebap-cased class names in the format `ec-theme-${name}`. For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice, once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.

### Patch Changes

- expressive-code@0.21.0

## 0.20.0

### Minor Changes

- 7c5c3c7: Add `removeCommentsWhenCopyingTerminalFrames` config option to `plugin-frames`. Thanks @AkashRajpurohit!

  If `true` (which is the default), the "Copy to clipboard" button of terminal window frames will remove comment lines starting with `#` from the copied text.

  This is useful to reduce the copied text to the actual commands users need to run, instead of also copying explanatory comments or instructions.

### Patch Changes

- Updated dependencies [7c5c3c7]
  - expressive-code@0.20.0

## 0.19.2

### Patch Changes

- expressive-code@0.19.2

## 0.19.1

### Patch Changes

- expressive-code@0.19.1

## 0.19.0

### Minor Changes

- f95d3f1: Add support for `diff`-like syntax and `lang` meta attribute. Thanks for the idea @hirasso!

  To mark lines as inserted or deleted, you can now use the widely supported `diff` language as an alternative to adding line numbers to the opening code fence.

  You can even specify a separate syntax highlighting language by adding a `lang="..."` attribute to the opening fence. See [README.md](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md) for more details.

### Patch Changes

- Updated dependencies [f95d3f1]
  - expressive-code@0.19.0

## 0.18.1

### Patch Changes

- expressive-code@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Add support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- Updated dependencies [4e26180]
  - expressive-code@0.18.0

## 0.17.0

### Patch Changes

- expressive-code@0.17.0

## 0.16.0

### Minor Changes

- 07012f7: Improve file type support when extracting file names from comments. Thanks @fflaten!

  - Adds more file types to the `LanguageGroups` object
  - Exports `LanguageGroups` to allow external modification
  - Extends automatic detection of frame type to differentiate between shell scripts and terminal sessions based on file name and/or shebang (if any)

### Patch Changes

- Updated dependencies [07012f7]
  - expressive-code@0.16.0

## 0.15.0

### Minor Changes

- Synchronize package versions to prevent future dependency issues

### Patch Changes

- Updated dependencies
  - expressive-code@0.15.0

## 0.14.0

### Minor Changes

- aa8f09d: Add support to override frame types per code block. Thanks @Princesseuh!

  By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

  You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

  The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.

### Patch Changes

- Updated dependencies [aa8f09d]
  - expressive-code@0.14.0

## 0.13.0

### Minor Changes

- f98937c: Add config options `useThemedScrollbars` and `useThemedSelectionColors`. Thanks @Princesseuh!

  Both options default to `true`. Set any of them to `false` to prevent themes from customizing their appearance and render them using the browser's default style.

### Patch Changes

- Updated dependencies [f98937c]
  - expressive-code@0.13.0

## 0.12.2

### Patch Changes

- 66de505: Fix non-working copy buttons in dynamically loaded content
- Updated dependencies [66de505]
  - expressive-code@0.12.2

## 0.12.1

### Patch Changes

- Make marked text selectable (#15). Thanks @hirasso!
- Updated dependencies
  - expressive-code@0.12.1

## 0.12.0

### Minor Changes

- e010774: Fix copy button on Firefox (still missing `:has()` support)

### Patch Changes

- expressive-code@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [276d221]
  - expressive-code@0.11.0

## 0.10.0

### Minor Changes

- 5da8685: Add RTL support (ensure that code lines are always LTR)

### Patch Changes

- Updated dependencies [5da8685]
  - expressive-code@0.10.0

## 0.9.1

### Patch Changes

- Enable stricter TypeScript checks (exactOptionalPropertyTypes), improve types
- Updated dependencies
  - expressive-code@0.9.1

## 0.9.0

### Minor Changes

- Add tabWidth option to normalize tabs to spaces (default: 2)

### Patch Changes

- expressive-code@0.9.0

## 0.8.4

### Patch Changes

- Updated dependencies
  - expressive-code@0.8.4

## 0.8.3

### Patch Changes

- expressive-code@0.8.3

## 0.8.2

### Patch Changes

- expressive-code@0.8.2

## 0.8.1

### Patch Changes

- expressive-code@0.8.1

## 0.8.0

### Minor Changes

- f8ed803: Add support for localized texts, add German to frames plugin

### Patch Changes

- expressive-code@0.8.0

## 0.7.0

### Minor Changes

- Add custom renderer support

### Patch Changes

- expressive-code@0.7.0

## 0.6.0

### Minor Changes

- af207b0: Allow plugins to add JS modules

### Patch Changes

- expressive-code@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies
  - expressive-code@0.5.0

## 0.4.2

### Patch Changes

- Turn off explanations to improve Shiki performance
- Updated dependencies
  - expressive-code@0.4.2

## 0.4.1

### Patch Changes

- Fix issues with color transforms
- Updated dependencies
  - expressive-code@0.4.1

## 0.4.0

### Minor Changes

- b6833ef: Provide access to all expressive-code exports

### Patch Changes

- expressive-code@0.4.0

## 0.3.0

### Minor Changes

- Synchronize package versions

### Patch Changes

- expressive-code@0.3.0

## 0.2.1

### Patch Changes

- Fix plugin options type

## 0.2.0

### Minor Changes

- Initial release

### Patch Changes

- Updated dependencies
  - expressive-code@0.2.0
