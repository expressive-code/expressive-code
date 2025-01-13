---
'@expressive-code/plugin-collapsible-sections': minor
---

Adds new `collapseStyle` prop to `@expressive-code/plugin-collapsible-sections`. Thank you @nerdymomocat!

The new prop allows selecting one of the following collapsible section styles:

- `github`: The default style, similar to the one used by GitHub. A summary line with an expand icon and the default text `X collapsed lines` is shown. When expanded, the summary line is replaced by the section's code lines. It is not possible to re-collapse the section.
- `collapsible-start`: When collapsed, the summary line looks like the `github` style. However, when expanded, it remains visible above the expanded code lines, making it possible to re-collapse the section.
- `collapsible-end`: Same as `collapsible-start`, but the summary line remains visible below the expanded code lines.
- `collapsible-auto`: Automatically selects `collapsible-start` or `collapsible-end` based on the location of the collapsible section in the code block. Uses `collapsible-start` unless the section ends at the bottom of the code block, in which case `collapsible-end` is used.
