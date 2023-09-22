# expressive-code

## 0.25.0

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - @expressive-code/core@0.25.0
  - @expressive-code/plugin-frames@0.25.0
  - @expressive-code/plugin-shiki@0.25.0
  - @expressive-code/plugin-text-markers@0.25.0

## 0.24.0

### Minor Changes

- af3171b: Render frame borders on top of background, add `editorActiveTabHighlightHeight` style setting.

  Previously, borders were rendered around the editor / terminal window, which could lead to unwanted empty margins between the window background and the drop shadow (e.g. in theme `nord`). Now, the border is rendered on top of the background to resolve this issue, making fully transparent borders act like padding instead.

  Additionally, the `editorActiveTabHighlightHeight` style setting was introduced, which allows customizing the colorful line that highlights the active editor tab. It defaults to `borderWidth`.

### Patch Changes

- af3171b: Pass global `styleOverrides` to plugin style resolver functions.

  This allows plugins to access their individual `styleOverrides` extensions even when values were defined at the global config level.

- Updated dependencies [af3171b]
- Updated dependencies [2c375b1]
- Updated dependencies [af3171b]
  - @expressive-code/plugin-text-markers@0.24.0
  - @expressive-code/plugin-frames@0.24.0
  - @expressive-code/plugin-shiki@0.24.0
  - @expressive-code/core@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
  - @expressive-code/core@0.23.0
  - @expressive-code/plugin-frames@0.23.0
  - @expressive-code/plugin-shiki@0.23.0
  - @expressive-code/plugin-text-markers@0.23.0

## 0.22.2

### Patch Changes

- @expressive-code/core@0.22.2
- @expressive-code/plugin-frames@0.22.2
- @expressive-code/plugin-shiki@0.22.2
- @expressive-code/plugin-text-markers@0.22.2

## 0.22.1

### Patch Changes

- @expressive-code/core@0.22.1
- @expressive-code/plugin-frames@0.22.1
- @expressive-code/plugin-shiki@0.22.1
- @expressive-code/plugin-text-markers@0.22.1

## 0.22.0

### Patch Changes

- @expressive-code/core@0.22.0
- @expressive-code/plugin-frames@0.22.0
- @expressive-code/plugin-shiki@0.22.0
- @expressive-code/plugin-text-markers@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [becc145]
  - @expressive-code/core@0.21.0
  - @expressive-code/plugin-frames@0.21.0
  - @expressive-code/plugin-shiki@0.21.0
  - @expressive-code/plugin-text-markers@0.21.0

## 0.20.0

### Minor Changes

- 7c5c3c7: Add `removeCommentsWhenCopyingTerminalFrames` config option to `plugin-frames`. Thanks @AkashRajpurohit!

  If `true` (which is the default), the "Copy to clipboard" button of terminal window frames will remove comment lines starting with `#` from the copied text.

  This is useful to reduce the copied text to the actual commands users need to run, instead of also copying explanatory comments or instructions.

### Patch Changes

- Updated dependencies [7c5c3c7]
  - @expressive-code/plugin-frames@0.20.0
  - @expressive-code/core@0.20.0
  - @expressive-code/plugin-shiki@0.20.0
  - @expressive-code/plugin-text-markers@0.20.0

## 0.19.2

### Patch Changes

- @expressive-code/core@0.19.2
- @expressive-code/plugin-frames@0.19.2
- @expressive-code/plugin-shiki@0.19.2
- @expressive-code/plugin-text-markers@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies [6da5008]
  - @expressive-code/plugin-frames@0.19.1
  - @expressive-code/core@0.19.1
  - @expressive-code/plugin-shiki@0.19.1
  - @expressive-code/plugin-text-markers@0.19.1

## 0.19.0

### Minor Changes

- f95d3f1: Add support for `diff`-like syntax and `lang` meta attribute. Thanks for the idea @hirasso!

  To mark lines as inserted or deleted, you can now use the widely supported `diff` language as an alternative to adding line numbers to the opening code fence.

  You can even specify a separate syntax highlighting language by adding a `lang="..."` attribute to the opening fence. See [README.md](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md) for more details.

### Patch Changes

- Updated dependencies [f95d3f1]
  - @expressive-code/plugin-text-markers@0.19.0
  - @expressive-code/core@0.19.0
  - @expressive-code/plugin-frames@0.19.0
  - @expressive-code/plugin-shiki@0.19.0

## 0.18.1

### Patch Changes

- Updated dependencies [ccc727e]
  - @expressive-code/plugin-frames@0.18.1
  - @expressive-code/core@0.18.1
  - @expressive-code/plugin-shiki@0.18.1
  - @expressive-code/plugin-text-markers@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Add support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- Updated dependencies [4e26180]
  - @expressive-code/plugin-frames@0.18.0
  - @expressive-code/plugin-shiki@0.18.0
  - @expressive-code/plugin-text-markers@0.18.0
  - @expressive-code/core@0.18.0

## 0.17.0

### Patch Changes

- Updated dependencies [aba43e2]
  - @expressive-code/plugin-frames@0.17.0
  - @expressive-code/core@0.17.0
  - @expressive-code/plugin-shiki@0.17.0
  - @expressive-code/plugin-text-markers@0.17.0

## 0.16.0

### Minor Changes

- 07012f7: Improve file type support when extracting file names from comments. Thanks @fflaten!

  - Adds more file types to the `LanguageGroups` object
  - Exports `LanguageGroups` to allow external modification
  - Extends automatic detection of frame type to differentiate between shell scripts and terminal sessions based on file name and/or shebang (if any)

### Patch Changes

- Updated dependencies [07012f7]
  - @expressive-code/plugin-frames@0.16.0
  - @expressive-code/core@0.16.0
  - @expressive-code/plugin-shiki@0.16.0
  - @expressive-code/plugin-text-markers@0.16.0

## 0.15.0

### Minor Changes

- Synchronize package versions to prevent future dependency issues

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.15.0
  - @expressive-code/plugin-frames@0.15.0
  - @expressive-code/plugin-shiki@0.15.0
  - @expressive-code/plugin-text-markers@0.15.0

## 0.14.0

### Minor Changes

- aa8f09d: Add support to override frame types per code block. Thanks @Princesseuh!

  By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

  You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

  The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.

### Patch Changes

- Updated dependencies [aa8f09d]
  - @expressive-code/plugin-frames@0.11.0

## 0.13.0

### Minor Changes

- f98937c: Add config options `useThemedScrollbars` and `useThemedSelectionColors`. Thanks @Princesseuh!

  Both options default to `true`. Set any of them to `false` to prevent themes from customizing their appearance and render them using the browser's default style.

### Patch Changes

- Updated dependencies [f98937c]
  - @expressive-code/core@0.11.0
  - @expressive-code/plugin-frames@0.10.2
  - @expressive-code/plugin-shiki@0.3.9
  - @expressive-code/plugin-text-markers@0.2.11

## 0.12.2

### Patch Changes

- 66de505: Fix non-working copy buttons in dynamically loaded content
- Updated dependencies [66de505]
  - @expressive-code/plugin-frames@0.10.1

## 0.12.1

### Patch Changes

- Make marked text selectable (#15). Thanks @hirasso!
- Updated dependencies
  - @expressive-code/plugin-text-markers@0.2.10

## 0.12.0

### Patch Changes

- Updated dependencies [e010774]
  - @expressive-code/plugin-frames@0.10.0

## 0.11.0

### Minor Changes

- 276d221: Reduce potential of unexpected changes through site-wide CSS

### Patch Changes

- Updated dependencies [276d221]
  - @expressive-code/core@0.10.0
  - @expressive-code/plugin-frames@0.9.1
  - @expressive-code/plugin-shiki@0.3.8
  - @expressive-code/plugin-text-markers@0.2.9

## 0.10.0

### Minor Changes

- 5da8685: Add RTL support (ensure that code lines are always LTR)

### Patch Changes

- Updated dependencies [5da8685]
  - @expressive-code/plugin-frames@0.9.0
  - @expressive-code/core@0.9.0
  - @expressive-code/plugin-shiki@0.3.7
  - @expressive-code/plugin-text-markers@0.2.8

## 0.9.1

### Patch Changes

- Enable stricter TypeScript checks (exactOptionalPropertyTypes), improve types
- Updated dependencies
  - @expressive-code/plugin-text-markers@0.2.7
  - @expressive-code/plugin-frames@0.8.2
  - @expressive-code/core@0.8.1
  - @expressive-code/plugin-shiki@0.3.6

## 0.9.0

## 0.8.4

### Patch Changes

- Fix feedback tooltip on mobile Safari
- Updated dependencies
  - @expressive-code/plugin-frames@0.8.1

## 0.8.3

### Patch Changes

- Updated dependencies
  - @expressive-code/plugin-frames@0.8.0
  - @expressive-code/core@0.8.0
  - @expressive-code/plugin-shiki@0.3.6
  - @expressive-code/plugin-text-markers@0.2.6

## 0.8.2

### Patch Changes

- Updated dependencies
  - @expressive-code/plugin-frames@0.7.0
  - @expressive-code/core@0.7.0
  - @expressive-code/plugin-shiki@0.3.5
  - @expressive-code/plugin-text-markers@0.2.5

## 0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [f8ed803]
  - @expressive-code/plugin-frames@0.6.0
  - @expressive-code/core@0.6.0
  - @expressive-code/plugin-shiki@0.3.4
  - @expressive-code/plugin-text-markers@0.2.4

## 0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [af207b0]
- Updated dependencies [af207b0]
  - @expressive-code/plugin-frames@0.5.0
  - @expressive-code/core@0.5.0
  - @expressive-code/plugin-shiki@0.3.3
  - @expressive-code/plugin-text-markers@0.2.3

## 0.5.0

### Minor Changes

- Automatically trim whitespace at the end of lines, and remove empty lines at the beginning & end of code blocks

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.4.0
  - @expressive-code/plugin-frames@0.4.1
  - @expressive-code/plugin-shiki@0.3.2
  - @expressive-code/plugin-text-markers@0.2.2

## 0.4.2

### Patch Changes

- Turn off explanations to improve Shiki performance
- Updated dependencies
  - @expressive-code/plugin-shiki@0.3.1

## 0.4.1

### Patch Changes

- Fix issues with color transforms
- Updated dependencies
  - @expressive-code/core@0.3.1

## 0.4.0

### Patch Changes

- Updated dependencies [6d316f6]
- Updated dependencies [6cdc248]
- Updated dependencies [3ffa599]
  - @expressive-code/core@0.3.0
  - @expressive-code/plugin-frames@0.4.0
  - @expressive-code/plugin-shiki@0.3.0
  - @expressive-code/plugin-text-markers@0.2.1

## 0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies
  - @expressive-code/plugin-frames@0.3.0

## 0.2.0

### Minor Changes

- Initial release

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.2.0
  - @expressive-code/plugin-frames@0.2.0
  - @expressive-code/plugin-shiki@0.2.0
  - @expressive-code/plugin-text-markers@0.2.0
