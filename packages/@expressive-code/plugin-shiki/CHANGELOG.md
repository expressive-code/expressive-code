# @expressive-code/plugin-shiki

## 0.28.1

### Patch Changes

- @expressive-code/core@0.28.1

## 0.28.0

### Patch Changes

- @expressive-code/core@0.28.0

## 0.27.1

### Patch Changes

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

- ef93adf: Improve caching logic to respect theme contents in addition to name
- Updated dependencies [d2277ba]
- Updated dependencies [d2277ba]
  - @expressive-code/core@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - @expressive-code/core@0.25.0

## 0.24.0

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

- @expressive-code/core@0.22.2

## 0.22.1

### Patch Changes

- @expressive-code/core@0.22.1

## 0.22.0

### Patch Changes

- @expressive-code/core@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [becc145]
  - @expressive-code/core@0.21.0

## 0.20.0

### Patch Changes

- @expressive-code/core@0.20.0

## 0.19.2

### Patch Changes

- @expressive-code/core@0.19.2

## 0.19.1

### Patch Changes

- @expressive-code/core@0.19.1

## 0.19.0

### Patch Changes

- @expressive-code/core@0.19.0

## 0.18.1

### Patch Changes

- @expressive-code/core@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Add support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- @expressive-code/core@0.18.0

## 0.17.0

### Patch Changes

- @expressive-code/core@0.17.0

## 0.16.0

### Patch Changes

- @expressive-code/core@0.16.0

## 0.15.0

### Minor Changes

- Synchronize package versions to prevent future dependency issues

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.15.0

## 0.3.9

### Patch Changes

- Updated dependencies [f98937c]
  - @expressive-code/core@0.11.0

## 0.3.8

### Patch Changes

- Updated dependencies [276d221]
  - @expressive-code/core@0.10.0

## 0.3.7

### Patch Changes

- Updated dependencies [5da8685]
  - @expressive-code/core@0.9.0

## 0.3.6

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.8.0

## 0.3.5

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.7.0

## 0.3.4

### Patch Changes

- Updated dependencies [f8ed803]
  - @expressive-code/core@0.6.0

## 0.3.3

### Patch Changes

- Updated dependencies [af207b0]
  - @expressive-code/core@0.5.0

## 0.3.2

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.4.0

## 0.3.1

### Patch Changes

- Turn off explanations to improve Shiki performance

## 0.3.0

### Minor Changes

- 3ffa599: Fix incorrect highlighting of terminal placeholders

### Patch Changes

- Updated dependencies [6d316f6]
  - @expressive-code/core@0.3.0

## 0.2.1

### Patch Changes

- Make @internal/test-utils a dev dependency as intended

## 0.2.0

### Minor Changes

- Initial release

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.2.0
  - @internal/test-utils@0.1.1
