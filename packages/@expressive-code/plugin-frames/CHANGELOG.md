# @expressive-code/plugin-frames

## 0.19.0

### Patch Changes

- @expressive-code/core@0.19.0

## 0.18.1

### Patch Changes

- ccc727e: Fix possible `querySelectorAll is not a function` issue on page content changes
  - @expressive-code/core@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Add support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- @expressive-code/core@0.18.0

## 0.17.0

### Minor Changes

- aba43e2: Add support for Windows drive letters and typical path patterns to file name comment detection. Thanks @fflaten!

### Patch Changes

- @expressive-code/core@0.17.0

## 0.16.0

### Minor Changes

- 07012f7: Improve file type support when extracting file names from comments. Thanks @fflaten!

  - Adds more file types to the `LanguageGroups` object
  - Exports `LanguageGroups` to allow external modification
  - Extends automatic detection of frame type to differentiate between shell scripts and terminal sessions based on file name and/or shebang (if any)

### Patch Changes

- @expressive-code/core@0.16.0

## 0.15.0

### Minor Changes

- Synchronize package versions to prevent future dependency issues

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.15.0

## 0.11.0

### Minor Changes

- aa8f09d: Add support to override frame types per code block. Thanks @Princesseuh!

  By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

  You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

  The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.

## 0.10.2

### Patch Changes

- Updated dependencies [f98937c]
  - @expressive-code/core@0.11.0

## 0.10.1

### Patch Changes

- 66de505: Fix non-working copy buttons in dynamically loaded content

## 0.10.0

### Minor Changes

- e010774: Fix copy button on Firefox (still missing :has() support)

## 0.9.1

### Patch Changes

- Updated dependencies [276d221]
  - @expressive-code/core@0.10.0

## 0.9.0

### Minor Changes

- 5da8685: Add RTL support (ensure that code lines are always LTR)

### Patch Changes

- Updated dependencies [5da8685]
  - @expressive-code/core@0.9.0

## 0.8.2

### Patch Changes

- Enable stricter TypeScript checks (exactOptionalPropertyTypes), improve types
- Updated dependencies
  - @expressive-code/core@0.8.1

## 0.8.1

### Patch Changes

- Fix feedback tooltip on mobile Safari

## 0.8.0

### Minor Changes

- Improve mobile core and copy button styles

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.8.0

## 0.7.0

### Minor Changes

- Fix CSS inconsistencies due to box-sizing

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.7.0

## 0.6.0

### Minor Changes

- f8ed803: Add support for localized texts, add German to frames plugin

### Patch Changes

- Updated dependencies [f8ed803]
  - @expressive-code/core@0.6.0

## 0.5.0

### Minor Changes

- af207b0: Add copy to clipboard button

### Patch Changes

- Updated dependencies [af207b0]
  - @expressive-code/core@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.4.0

## 0.4.0

### Minor Changes

- 6cdc248: Make tab margins configurable, improve defaults

### Patch Changes

- Updated dependencies [6d316f6]
  - @expressive-code/core@0.3.0

## 0.3.0

### Minor Changes

- Improve tab style settings (add `editorActiveTabBorder`, actually use `editorTabBarBorderBottom`)

## 0.2.0

### Minor Changes

- Initial release

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.2.0
