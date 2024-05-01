# @expressive-code/plugin-frames

## 0.35.3

### Patch Changes

- c892206: - Fixes file names containing `+` not being recognized in file name comments. Thank you @amandaguthrie!
  - @expressive-code/core@0.35.3

## 0.35.2

### Patch Changes

- Updated dependencies [dd54846]
  - @expressive-code/core@0.35.2

## 0.35.1

### Patch Changes

- @expressive-code/core@0.35.1

## 0.35.0

### Patch Changes

- @expressive-code/core@0.35.0

## 0.34.2

### Patch Changes

- Updated dependencies [cbc16e9]
  - @expressive-code/core@0.34.2

## 0.34.1

### Patch Changes

- Updated dependencies [1b2279f]
  - @expressive-code/core@0.34.1

## 0.34.0

### Minor Changes

- b6e7167: **Potentially breaking change:** Since this version, all packages are only distributed in modern ESM format, which greatly reduces bundle size.

  Most projects should not be affected by this change at all, but in case you still need to import Expressive Code packages into a CommonJS project, you can use the widely supported `await import(...)` syntax.

### Patch Changes

- Updated dependencies [af2a10a]
- Updated dependencies [b94a91d]
- Updated dependencies [af2a10a]
- Updated dependencies [9eb8619]
- Updated dependencies [b6e7167]
- Updated dependencies [2ef2503]
- Updated dependencies [b94a91d]
  - @expressive-code/core@0.34.0

## 0.33.5

### Patch Changes

- Updated dependencies [2469749]
  - @expressive-code/core@0.33.5

## 0.33.4

### Patch Changes

- @expressive-code/core@0.33.4

## 0.33.3

### Patch Changes

- @expressive-code/core@0.33.3

## 0.33.2

### Patch Changes

- Updated dependencies [a408e31]
  - @expressive-code/core@0.33.2

## 0.33.1

### Patch Changes

- Updated dependencies [f3ac898]
  - @expressive-code/core@0.33.1

## 0.33.0

### Minor Changes

- 77e4142: Adds `nu` and `nushell` to the list of terminal languages. Thanks @jacobdalamb!
- b7a0607: Adds `metaOptions` read-only property to `ExpressiveCodeBlock` instances.

  This new property contains a parsed version of the code block's `meta` string. This allows plugins to easily access the options specified by users in the opening code fence of a code block, without having to parse the `meta` string themselves.

  All official plugins now use this new API to merge any meta options into the new extensible `ExpressiveCodeBlock.props` property.

### Patch Changes

- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
  - @expressive-code/core@0.33.0

## 0.32.4

### Patch Changes

- Updated dependencies [20e900a]
  - @expressive-code/core@0.32.4

## 0.32.3

### Patch Changes

- @expressive-code/core@0.32.3

## 0.32.2

### Patch Changes

- @expressive-code/core@0.32.2

## 0.32.1

### Patch Changes

- @expressive-code/core@0.32.1

## 0.32.0

### Patch Changes

- @expressive-code/core@0.32.0

## 0.31.0

### Patch Changes

- @expressive-code/core@0.31.0

## 0.30.2

### Patch Changes

- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
  - @expressive-code/core@0.30.2

## 0.30.1

### Patch Changes

- @expressive-code/core@0.30.1

## 0.30.0

### Patch Changes

- @expressive-code/core@0.30.0

## 0.29.4

### Patch Changes

- Updated dependencies [765dd00]
- Updated dependencies [765dd00]
  - @expressive-code/core@0.29.4

## 0.29.3

### Patch Changes

- @expressive-code/core@0.29.3

## 0.29.2

### Patch Changes

- e18c69d: Comments like `// ...` are now no longer incorrectly detected as file names. Thanks @kdheepak!
  - @expressive-code/core@0.29.2

## 0.29.1

### Patch Changes

- @expressive-code/core@0.29.1

## 0.29.0

### Minor Changes

- e020b64: Cleans up frontmatter after file name comment extraction.

  If a file name comment gets extracted from a code block without a `title` attribute, additional cleanup work is now performed on the surrounding lines:

  - If the code block's language supports frontmatter, and the comment was located in a frontmatter block that has now become empty, the empty frontmatter block gets removed.
  - If the line following the removed comment (or removed frontmatter block) is empty, it gets removed as well.

### Patch Changes

- Updated dependencies [85dbab8]
  - @expressive-code/core@0.29.0

## 0.28.2

### Patch Changes

- @expressive-code/core@0.28.2

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

- 3e0e8c4: Re-initialize copy to clipboard buttons after Astro view transitions.
  - @expressive-code/core@0.26.1

## 0.26.0

### Minor Changes

- d2277ba: Themed selection now keeps the code foreground color intact (like VS Code).

  Color overlays no longer prevent text from being selectable.

### Patch Changes

- Updated dependencies [d2277ba]
- Updated dependencies [d2277ba]
  - @expressive-code/core@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - @expressive-code/core@0.25.0

## 0.24.0

### Minor Changes

- af3171b: Renders frame borders on top of background, adds `editorActiveTabHighlightHeight` style setting.

  Previously, borders were rendered around the editor / terminal window, which could lead to unwanted empty margins between the window background and the drop shadow (e.g. in theme `nord`). Now, the border is rendered on top of the background to resolve this issue, making fully transparent borders act like padding instead.

  Additionally, the `editorActiveTabHighlightHeight` style setting was introduced, which allows customizing the colorful line that highlights the active editor tab. It defaults to `borderWidth`.

### Patch Changes

- Updated dependencies [af3171b]
- Updated dependencies [2c375b1]
  - @expressive-code/core@0.24.0

## 0.23.0

### Minor Changes

- bfed62a: Adds support for extracting file names from CSS file comments.

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

### Minor Changes

- 7c5c3c7: Adds `removeCommentsWhenCopyingTerminalFrames` config option to `plugin-frames`. Thanks @AkashRajpurohit!

  If `true` (which is the default), the "Copy to clipboard" button of terminal window frames will remove comment lines starting with `#` from the copied text.

  This is useful to reduce the copied text to the actual commands users need to run, instead of also copying explanatory comments or instructions.

### Patch Changes

- @expressive-code/core@0.20.0

## 0.19.2

### Patch Changes

- @expressive-code/core@0.19.2

## 0.19.1

### Patch Changes

- 6da5008: Adds support for CSS variables to option `styleOverrides.terminalTitlebarDotsForeground`. Thanks @delucis!
  - @expressive-code/core@0.19.1

## 0.19.0

### Patch Changes

- @expressive-code/core@0.19.0

## 0.18.1

### Patch Changes

- ccc727e: Fixes possible `querySelectorAll is not a function` issue on page content changes
  - @expressive-code/core@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Adds support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- @expressive-code/core@0.18.0

## 0.17.0

### Minor Changes

- aba43e2: Adds support for Windows drive letters and typical path patterns to file name comment detection. Thanks @fflaten!

### Patch Changes

- @expressive-code/core@0.17.0

## 0.16.0

### Minor Changes

- 07012f7: Improves file type support when extracting file names from comments. Thanks @fflaten!

  - Adds more file types to the `LanguageGroups` object
  - Exports `LanguageGroups` to allow external modification
  - Extends automatic detection of frame type to differentiate between shell scripts and terminal sessions based on file name and/or shebang (if any)

### Patch Changes

- @expressive-code/core@0.16.0

## 0.15.0

### Minor Changes

- Synchronizes package versions to prevent future dependency issues.

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.15.0

## 0.11.0

### Minor Changes

- aa8f09d: Adds support to override frame types per code block. Thanks @Princesseuh!

  By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

  You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

  The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.

## 0.10.2

### Patch Changes

- Updated dependencies [f98937c]
  - @expressive-code/core@0.11.0

## 0.10.1

### Patch Changes

- 66de505: Fixes non-working copy buttons in dynamically loaded content.

## 0.10.0

### Minor Changes

- e010774: Fixes copy button on Firefox (still missing `:has()` support).

## 0.9.1

### Patch Changes

- Updated dependencies [276d221]
  - @expressive-code/core@0.10.0

## 0.9.0

### Minor Changes

- 5da8685: Adds RTL support (ensure that code lines are always LTR).

### Patch Changes

- Updated dependencies [5da8685]
  - @expressive-code/core@0.9.0

## 0.8.2

### Patch Changes

- Enables stricter TypeScript checks (exactOptionalPropertyTypes), improves types.
- Updated dependencies
  - @expressive-code/core@0.8.1

## 0.8.1

### Patch Changes

- Fixes feedback tooltip on mobile Safari.

## 0.8.0

### Minor Changes

- Improves mobile core and copy button styles.

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.8.0

## 0.7.0

### Minor Changes

- Fixes CSS inconsistencies due to box-sizing.

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.7.0

## 0.6.0

### Minor Changes

- f8ed803: Adds support for localized texts, adds German to frames plugin.

### Patch Changes

- Updated dependencies [f8ed803]
  - @expressive-code/core@0.6.0

## 0.5.0

### Minor Changes

- af207b0: Adds copy to clipboard button.

### Patch Changes

- Updated dependencies [af207b0]
  - @expressive-code/core@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies
  - @expressive-code/core@0.4.0

## 0.4.0

### Minor Changes

- 6cdc248: Makes tab margins configurable, improves defaults.

### Patch Changes

- Updated dependencies [6d316f6]
  - @expressive-code/core@0.3.0

## 0.3.0

### Minor Changes

- Improves tab style settings (adds `editorActiveTabBorder`, actually uses `editorTabBarBorderBottom`).

## 0.2.0

### Minor Changes

- Initial release.
