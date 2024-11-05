# rehype-expressive-code

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
