# rehype-expressive-code

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
