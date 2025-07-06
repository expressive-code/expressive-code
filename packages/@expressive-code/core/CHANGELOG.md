# @expressive-code/core

## 0.41.3

### Patch Changes

- eb82591: Fixes WCAG 4.1.2 compliance issue by dynamically adding `role="region"` to scrollable code blocks. Thank you @ruslanpashkov!

## 0.41.2

## 0.41.1

### Patch Changes

- a53e749: Fixes a regression that caused inline text markers to be rendered with two layered background colors.

## 0.41.0

### Minor Changes

- 380bfcc: Adds new `createInlineSvgUrl` export that creates an inline SVG image data URL from the given contents of an SVG file.

  You can use it to embed SVG images directly into a plugin's styles or HAST, or pass it to an existing `styleOverrides` icon setting.

- 0f33477: Updates Shiki to the latest version (3.2.2).

  This adds support for the strikethrough ANSI control code, updates language grammars and adds the bundled themes `gruvbox-dark-hard`, `gruvbox-dark-medium`, `gruvbox-dark-soft`, `gruvbox-light-hard`, `gruvbox-light-medium`, and `gruvbox-light-soft`.

- 6497f09: Adds new `preventUnitlessValues` property to `PluginStyleSettings`. Thank you @RantingHuman!

  Plugins can set this property to an array of style setting paths to prevent unitless values for specific style settings. If the user passes a unitless value to one of these settings, the engine will automatically add `px` to the value. This is recommended for settings used in CSS calculations which would otherwise break if a unitless value is passed.

- a826a4a: Adds a new `hangingIndent` prop to all code blocks. Thank you @Signum!

  By setting this prop to a positive number of columns (either in the opening code fence, as a prop on the `<Code>` component, or in the `defaultProps` config option), you can now further refine the indentation of wrapped lines.

  If the prop `preserveIndent` is `true` (which is the default), the `hangingIndent` value is added to the indentation of the original line. If `preserveIndent` is `false`, the value is used as the fixed indentation level of all wrapped lines.

  This option only affects how the code block is displayed and does not change the actual code. When copied to the clipboard, the code will still contain the original unwrapped lines.

- 0f33477: Extends ANSI formatting support to allow background colors and strikethrough text. Thank you @dhruvkb!
- 0f33477: Adds support for `bgColor` and `strikethrough` to `InlineStyleAnnotation`. Thank you @dhruvkb!

## 0.40.2

### Patch Changes

- 1734d73: Prevents the default [style reset](https://expressive-code.com/reference/configuration/#usestylereset) from interfering with more complex SVGs inside Expressive Code blocks. Now, not only `path` elements, but all SVGs and their contents are excluded from the reset. Thank you @xt0rted!

## 0.40.1

### Patch Changes

- ecf6ca1: Removes unnecessary end padding from the first code line if the copy to clipboard button is disabled. Thank you @goulvenclech!

## 0.40.0

## 0.39.0

## 0.38.3

## 0.38.2

## 0.38.1

### Patch Changes

- 440bb83: Fixes invalid CSS file links when using the `Code` component together with `plugin-collapsible-sections` and `pnpm`. Thank you @simonporter007 and @ayZagen for the report!

## 0.38.0

## 0.37.1

## 0.37.0

## 0.36.1

## 0.36.0

### Minor Changes

- ca54f6e: Updates Shiki dependency to the latest version.

## 0.35.6

## 0.35.5

## 0.35.4

### Patch Changes

- 876d24c: Improves performance of client script managing `tabindex` on code samples. Thanks @delucis!

## 0.35.3

## 0.35.2

### Patch Changes

- dd54846: Fixes text marker labels including special characters like `\` by properly escaping CSS variable contents. Thank you @stancl!

## 0.35.1

## 0.35.0

## 0.34.2

### Patch Changes

- cbc16e9: Updates dependencies to the latest versions. Thank you @bluwy!

## 0.34.1

### Patch Changes

- 1b2279f: Fixes a11y property `tabindex="0"` being set on non-scrollable code blocks.

  Instead of always adding `tabindex="0"` to the `<pre>` element of code blocks, a small JS module is now used to conditionally add the property to scrollable code blocks only. This ensures that scrollable regions can be accessed via keyboard navigation while avoiding audit warnings about `tabindex` being used on non-scrollable elements.

## 0.34.0

### Minor Changes

- af2a10a: Adds a `data-language` attribute to the `<pre>` element of rendered code blocks.

  The value is set to code block's syntax highlighting language as specified in the opening code fence or `<Code lang="...">` attribute (e.g. `js` or `md`).

  If a code block has no language specified, it will default to `plaintext`.

  You can use this attribute to apply styles to code blocks based on their language.

- b94a91d: Updates dependencies `hast`, `hastscript` and `hast-util-*` to the latest versions.

  **Potentially breaking change:** Unfortunately, some of the new `hast` types are incompatible with their old versions. If you created custom plugins to manipulate HAST nodes, you may need to update your dependencies as well and probably change some types. For example, if you were using the `Parent` type before, you will probably need to replace it with `Parents` or `Element` in the new version.

- b94a91d: Adds a new `/hast` entrypoint to `@expressive-code/core`, `expressive-code`, `remark-expressive-code` and `astro-expressive-code` to simplify plugin development.

  This new entrypoint provides direct access to the correct versions of HAST types and commonly used tree traversal, querying and manipulation functions. Instead of having to add your own dependencies on libraries like `hastscript`, `hast-util-select` or `unist-util-visit` to your project and manually keeping them in sync with the versions used by Expressive Code, you can now import the internally used functions and types directly from this new entrypoint.

- af2a10a: Adds `definePlugin` export to `@expressive-code/core` and all integrations to help define an Expressive Code plugin.

  Using this function is recommended, but not required. It just passes through the given object, but it also provides type information for your editor's auto-completion and type checking.

- b6e7167: **Potentially breaking change:** Since this version, all packages are only distributed in modern ESM format, which greatly reduces bundle size.

  Most projects should not be affected by this change at all, but in case you still need to import Expressive Code packages into a CommonJS project, you can use the widely supported `await import(...)` syntax.

- 2ef2503: Makes Expressive Code compatible with Bun. Thank you @tylergannon for the fix and @richardguerre for the report!

  This fixes the error `msg.match is not a function` that was thrown when trying to use Expressive Code with Bun.

  Additionally, the `type` modifier was added to some imports and exports to fix further Bun issues with plugins and integrations found during testing.

- b94a91d: Allows annotations to be defined as plain objects without the need to extend a class, as long as they have all properties required by `ExpressiveCodeAnnotation`.

### Patch Changes

- 9eb8619: Clones internal TinyColor instance with an object input instead of string input for faster parsing performance. Thanks @bluwy!

## 0.33.5

### Patch Changes

- 2469749: Improves word wrap behavior on very narrow screens and when using larger font sizes by allowing wrapping to start at column 20 instead of 30.

## 0.33.4

## 0.33.3

## 0.33.2

### Patch Changes

- a408e31: Improves error logging in case any plugin hooks fail.

## 0.33.1

### Patch Changes

- f3ac898: Fixes an issue where lines containing a very long word after the initial indentation would wrap incorrectly.

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

## 0.32.4

### Patch Changes

- 20e900a: Improves automatic color contrast correction when using CSS variables in styleOverrides. Thanks @heycassidy!

  It is now possible to use CSS variables in the `styleOverrides` setting `codeBackground` without negatively affecting the automatic color contrast correction controlled by the `minSyntaxHighlightingColorContrast` setting. If a CSS variable is encountered that cannot be resolved to a color value on the server, Expressive Code now automatically uses the theme's background color as a fallback for color contrast calculations. You can also provide your own fallback color using the CSS variable fallback syntax, e.g. `var(--gray-50, #f9fafb)`.

## 0.32.3

## 0.32.2

## 0.32.1

## 0.32.0

## 0.31.0

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

## 0.30.1

## 0.30.0

## 0.29.4

### Patch Changes

- 765dd00: Unknown code block languages now log a warning and render as plaintext instead of throwing an error.
- 765dd00: Adds the config option `useStyleReset`.

  This option determines if code blocks should be protected against influence from site-wide styles. This protection was always enabled before this release and could not be turned off.

  When enabled, Expressive Code uses the declaration `all: revert` to revert all CSS properties to the values they would have had without any site-wide styles. This ensures the most predictable results out of the box.

  You can now set this to `false` if you want your site-wide styles to influence the code blocks.

## 0.29.3

## 0.29.2

## 0.29.1

## 0.29.0

### Minor Changes

- 85dbab8: Updates default fonts to match Tailwind CSS.

  The previous set of default fonts could result in very thin character line widths on iOS devices. This is now fixed by using the same widely tested set of fonts that Tailwind CSS uses.

## 0.28.2

## 0.28.1

## 0.28.0

## 0.27.1

## 0.27.0

### Minor Changes

- f19746b: Removes engine properties `configClassName` and `themeClassName`.

  The `configClassName` property was previously used to add a config-dependent class name to the CSS selectors used to style code blocks.

  As this property was automatically calculated by hashing the configuration object, it introduced a level of unpredictability, which has now been removed in favor of static base styles.

  The `themeClassName` property was previously used to add a theme-dependent class name to code blocks. Its format was `ec-theme-<name>`, where `<name>` was the kebab-cased name of the theme.

  As code blocks are now styled using CSS variables instead of generating multiple blocks for all themes and attaching class names to them, this property is no longer needed.

- f19746b: Adds `useDarkModeMediaQuery` config option.

  This new option determines if CSS code is generated that uses a `prefers-color-scheme` media query to automatically switch between light and dark themes based on the user's system preferences.

  Defaults to `true` if your `themes` option is set to one dark and one light theme (which is the default), and `false` otherwise.

- f19746b: Rendering multiple themes no longer generates duplicate CSS and HTML output.

  In previous versions, a full set of CSS styles was generated for each individual theme, and each code block was rendered multiple times to include the HTML for each theme.

  In this version, the CSS output has been changed to a single static set of base styles that uses CSS variables to allow efficient switching between themes.

  Also, the HTML output for code blocks is now generated only once, and theme-dependent styles are applied using CSS variables.

  These changes significantly reduce page size when using multiple themes, especially on pages with many code blocks.

  If you have added CSS code to your site that relies on the old output (e.g. by selectively hiding or showing theme-specific code blocks based on their class name), you will need to update it to work with the new output.

  > **Note**: Before writing new custom CSS, please consider if you can achieve your desired result out of the box now. For example, if your `themes` option contains one dark and one light theme, the `useDarkModeMediaQuery` option will generate a `prefers-color-scheme` media query for you by default.

- f19746b: Adds `minSyntaxHighlightingColorContrast` config option.

  This new option determines if Expressive Code should process the syntax highlighting colors of all themes to ensure an accessible minimum contrast ratio between foreground and background colors.

  Defaults to `5.5`, which ensures a contrast ratio of at least 5.5:1. You can change the desired contrast ratio by providing another value, or turn the feature off by setting this option to `0`.

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

- f19746b: Renames config option `theme` to `themes`.

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

- f19746b: Adds `cascadeLayer` config option.

  This new option allows to specify a CSS cascade layer name that should be used for all generated CSS styles.

  If you are using [cascade layers](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_layers) on your site to control the order in which CSS rules are applied, set this option to a non-empty string, and Expressive Code will wrap all of its generated CSS styles in a `@layer` rule with the given name.

## 0.26.2

## 0.26.1

## 0.26.0

### Minor Changes

- d2277ba: Themed selection now keeps the code foreground color intact (like VS Code).

  Color overlays no longer prevent text from being selectable.

### Patch Changes

- d2277ba: Makes code blocks accessible by keyboard.

## 0.25.0

### Minor Changes

- 126563e: Improves theme loading by allowing to pass more theme types directly.

  The `theme` config option now supports the following value types:

  - any theme object compatible with VS Code or Shiki (e.g. imported from an NPM theme package)
  - any ExpressiveCodeTheme instance (e.g. using `ExpressiveCodeTheme.fromJSONString(...)`
    to load a custom JSON/JSONC theme file yourself)
  - if you are using a higher-level integration like `remark-expressive-code` or `astro-expressive-code`:
    - any theme name bundled with Shiki (e.g. `dracula`)
  - any combination of the above in an array

- 126563e: Adds more colors to `ExpressiveCodeTheme.applyHueAndChromaAdjustments`, allows chaining.

  The `applyHueAndChromaAdjustments()` function now also adjusts `titleBar.activeBackground` and `titleBar.border` properly. Also, it returns the `ExpressiveCodeTheme` instance to allow chaining.

## 0.24.0

### Minor Changes

- 2c375b1: Migrates i18n functions to string templates with plural support.

  Translated texts including dynamic parts (e.g. a line count) previously used a function syntax. This was convenient to use during plugin development, but made it impossible to use the popular JSON file format as a source of translated texts. To make it easier to integrate Expressive Code, this release gets rid of the function syntax and adds a `formatTemplate` function that understands a simple string template syntax including placeholders and plural support.

  Simple placeholders are written as variable names in curly brackets, e.g. `{variableName}`.

  You can also use conditional placeholders by separating multiple choices with semicolons and optionally adding a condition before each choice, e.g. `{itemCount;1=item;items}` or `{variableName; 0=zero; >0=positive; negative}`.

### Patch Changes

- af3171b: Passes global `styleOverrides` to plugin style resolver functions.

  This allows plugins to access their individual `styleOverrides` extensions even when values were defined at the global config level.

## 0.23.0

### Minor Changes

- bfed62a: Adds config option `customizeTheme`.

  This optional function is called once per theme during engine initialization with the loaded theme as its only argument.

  It allows customizing the loaded theme and can be used for various purposes:

  - You can change a theme's `name` property to influence its generated CSS class name (e.g. `theme.name = 'dark'` will result in code blocks having the class `ec-theme-dark`).
  - You can create color variations of themes by using `theme.applyHueAndChromaAdjustments()`.

- bfed62a: Adds plugin styles to the `styleOverrides` config option.

  So far, this object only contained core styles like colors, fonts, paddings and more. Now, plugins also contribute their own style settings to this object.

  For example, if the `frames` plugin is installed, you can now override its `shadowColor` by setting `styleOverrides.frames.shadowColor` to a color value.

- bfed62a: Adds `applyHueAndChromaAdjustments` function to `ExpressiveCodeTheme`.

  You can now apply chromatic adjustments to entire groups of theme colors while keeping their relative lightness and alpha components intact. This can be used to quickly create theme variants that fit the color scheme of any website or brand.

  Adjustments can either be defined as hue and chroma values in the OKLCH color space (range 0–360 for hue, 0–0.4 for chroma), or these values can be extracted from hex color strings (e.g. `#3b82f6`).

  You can target predefined groups of theme colors (e.g. `backgrounds`, `accents`) and/or use the `custom` property to define your own groups of theme colors to be adjusted.

- bfed62a: Adds `styleOverrides` to `ExpressiveCodeTheme`.

  Themes can now provide their own `styleOverrides`, which take precedence over global `styleOverrides` and the default styles.

## 0.22.2

## 0.22.1

## 0.22.0

## 0.21.0

### Minor Changes

- becc145: Adds multi-theme support to the `theme` config option.

  You can now pass an array of themes to the `theme` config option of `remark-expressive-code` and `astro-expressive-code`.

  This allows you to render each code block in your markdown/MDX documents using multiple themes, e.g. to support light and dark modes on your site.

  **Note**: If you use this feature, you will also need to add custom CSS code to your site to ensure that only one theme is visible at any time.

  To allow targeting all code blocks of a given theme through CSS, the theme property `name` is used to generate kebap-cased class names in the format `ec-theme-${name}`. For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice, once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.

## 0.20.0

## 0.19.2

## 0.19.1

## 0.19.0

## 0.18.1

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

### Minor Changes

- Synchronizes package versions to prevent future dependency issues.

## 0.11.0

### Minor Changes

- f98937c: Adds config options `useThemedScrollbars` and `useThemedSelectionColors`. Thanks @Princesseuh!

  Both options default to `true`. Set any of them to `false` to prevent themes from customizing their appearance and render them using the browser's default style.

## 0.10.0

### Minor Changes

- 276d221: Reduces potential of unexpected changes through site-wide CSS.

## 0.9.0

### Minor Changes

- 5da8685: Adds RTL support (ensure that code lines are always LTR).

## 0.8.1

### Patch Changes

- Enables stricter TypeScript checks (exactOptionalPropertyTypes), improves types.

## 0.8.0

### Minor Changes

- Improves mobile core and copy button styles.

## 0.7.0

### Minor Changes

- Fixes CSS inconsistencies due to box-sizing.

## 0.6.0

### Minor Changes

- f8ed803: Adds support for localized texts, adds German to frames plugin.

## 0.5.0

### Minor Changes

- af207b0: Allows plugins to add JS modules.

## 0.4.0

### Minor Changes

- Automatically trims whitespace at the end of lines, and removes empty lines at the beginning & end of code blocks.

## 0.3.1

### Patch Changes

- Fixes issues with color transforms.

## 0.3.0

### Minor Changes

- 6d316f6: Changes base font size unit to rem.

## 0.2.1

### Patch Changes

- Removes any padding from pre element.

## 0.2.0

### Minor Changes

- Initial release.
