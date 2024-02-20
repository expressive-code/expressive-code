---
'@expressive-code/plugin-collapsible-sections': minor
---

Adds new `collapsePreserveIndent` prop to `@expressive-code/plugin-collapsible-sections` and replaces `styleOverrides` property `closedPadding` with `closedPaddingBlock`.

The new prop determines if collapsed section titles (`X collapsed lines`) should be indented to preserve the minimum indent level of their contained collapsed code lines. This allows collapsed sections to integrate better with the surrounding code. Defaults to `true`.

**Breaking change:** If you used the `styleOverrides` property `closedPadding` before to change the default padding around closed collapsed section headings, you must now use `closedPaddingBlock` instead. While the old property supported specifying paddings for all four sides, the new property only supports paddings in the block direction (top and bottom in horizontal writing mode). This change was necessary to make collapsed sections compatible with line wrapping and gutter elements.
