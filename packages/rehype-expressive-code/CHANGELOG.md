# rehype-expressive-code

## 0.41.1

### Patch Changes

- a53e749: Fixes a regression that caused inline text markers to be rendered with two layered background colors.
- Updated dependencies [a53e749]
  - expressive-code@0.41.1

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
- 380bfcc: Adds the following new `styleOverrides` settings:

  - `frames.copyIcon`: Allows overriding the SVG icon used for the copy button. Thank you @louisescher!
  - `frames.terminalIcon`: Allows overriding the SVG icon used for the terminal window frame. Defaults to three dots in the top left corner.

- 0f33477: Adds support for `bgColor` and `strikethrough` to `InlineStyleAnnotation`. Thank you @dhruvkb!

### Patch Changes

- Updated dependencies [380bfcc]
- Updated dependencies [0f33477]
- Updated dependencies [6497f09]
- Updated dependencies [a826a4a]
- Updated dependencies [0f33477]
- Updated dependencies [380bfcc]
- Updated dependencies [0f33477]
  - expressive-code@0.41.0

## 0.40.2

### Patch Changes

- 1734d73: Prevents the default [style reset](https://expressive-code.com/reference/configuration/#usestylereset) from interfering with more complex SVGs inside Expressive Code blocks. Now, not only `path` elements, but all SVGs and their contents are excluded from the reset. Thank you @xt0rted!
- Updated dependencies [1734d73]
  - expressive-code@0.40.2

## 0.40.1

### Patch Changes

- ecf6ca1: Removes unnecessary end padding from the first code line if the copy to clipboard button is disabled. Thank you @goulvenclech!
- Updated dependencies [ecf6ca1]
  - expressive-code@0.40.1

## 0.40.0

### Patch Changes

- expressive-code@0.40.0

## 0.39.0

### Minor Changes

- 9149332: Updates Shiki to the latest version (1.26.1).

### Patch Changes

- Updated dependencies [9149332]
  - expressive-code@0.39.0

## 0.38.3

### Patch Changes

- 90b614e: Makes the types used by the `shiki.langs` config option less strict to align them better with actual grammars found in the wild. This attempts to reduce the amount of type errors that occurred before when using external grammars, while still being supported by the language processing code.
- Updated dependencies [90b614e]
  - expressive-code@0.38.3

## 0.38.2

### Patch Changes

- 480361a: Fixes an issue where the optional `getBlockLocale` callback function was not called when using the `<Code>` component. Thank you @HiDeoo!

  As the parent document's source file path is not available from an Astro component, the `file` property passed to the `getBlockLocale` callback function now contains an additional `url` property that will be set to the value of `Astro.url` in this case.

  When determining the locale of a code block, it is recommended to use this new property first, and only fall back to the existing `path` and `cwd` properties if `url` is undefined.

  - expressive-code@0.38.2

## 0.38.1

### Patch Changes

- expressive-code@0.38.1

## 0.38.0

### Minor Changes

- 944dda0: Updates Shiki to the latest version (1.22.2).

### Patch Changes

- expressive-code@0.38.0

## 0.37.1

### Patch Changes

- expressive-code@0.37.1

## 0.37.0

### Patch Changes

- expressive-code@0.37.0

## 0.36.1

### Patch Changes

- expressive-code@0.36.1

## 0.36.0

### Minor Changes

- bff1106: Adds the experimental `transformers` option to the Shiki plugin. Thank you @MichaelMakesGames!

  This option allows you to specify a list of Shiki transformers to be called during syntax highlighting.

  **Important:** This option is marked as experimental because it only supports a **very limited subset** of Shiki transformer features right now. Most importantly, transformers cannot modify a code block's text contents in any way, so most popular transformers will not work.

  In its current state, this option allows you to use transformers that solely modify the tokens produced by Shiki to improve syntax highlighting, e.g. applying bracket matching or changing the color of certain tokens.

  Attempting to pass incompatible transformers to this option will throw an error. This is not a bug, neither in Expressive Code, nor in Shiki or the transformers. Please do not report incompatibilities to other authors, as they are unable to fix them. The current limitations exist because the Shiki transformer API is incompatible with Expressive Code's architecture, and we will continue to work on closing the gap and improving this feature.

- ca54f6e: Updates Shiki dependency to the latest version.

### Patch Changes

- Updated dependencies [bff1106]
- Updated dependencies [ca54f6e]
  - expressive-code@0.36.0

## 0.35.6

### Patch Changes

- ffab5a5: Hides the copy code button in case JavaScript is disabled. Thank you @imkunet!
- Updated dependencies [ffab5a5]
  - expressive-code@0.35.6

## 0.35.5

### Patch Changes

- expressive-code@0.35.5

## 0.35.4

### Patch Changes

- 876d24c: Improves performance of client script managing `tabindex` on code samples. Thanks @delucis!
- Updated dependencies [876d24c]
  - expressive-code@0.35.4

## 0.35.3

### Patch Changes

- expressive-code@0.35.3

## 0.35.2

### Patch Changes

- dd54846: Fixes text marker labels including special characters like `\` by properly escaping CSS variable contents. Thank you @stancl!
- Updated dependencies [dd54846]
  - expressive-code@0.35.2

## 0.35.1

### Patch Changes

- 389c098: Fixes style and script assets not loading properly when used with MDX in Next.js.

  The MDX processing chain used by current Next.js versions caused unwanted escaping of the Expressive Code inline assets, which resulted in hydration issues and prevented features that depend on JS modules like the copy button from working.

  In these cases, Expressive Code now uses a different approach to inject the inline assets to ensure that no unwanted escaping occurs.

  - expressive-code@0.35.1

## 0.35.0

### Minor Changes

- 1875948: Adds the new package `rehype-expressive-code` as the successor to `remark-expressive-code`, which is now considered deprecated.

  If you're using the Astro integration `astro-expressive-code`, you will be automatically using the new package and don't need to do anything.

  If your project has a dependency on `remark-expressive-code`, you should replace it with `rehype-expressive-code` and pass it as a rehype plugin instead of a remark plugin. See the [installation instructions](https://expressive-code.com/installation/#nextjs) for an example.

  The new package includes performance improvements and also works with the latest versions of MDX in popular site generators.

### Patch Changes

- Updated dependencies [1875948]
  - expressive-code@0.35.0
