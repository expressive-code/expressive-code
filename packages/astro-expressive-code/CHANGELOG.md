# astro-expressive-code

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
