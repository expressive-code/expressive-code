---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Adds word wrap support to all Expressive Code blocks.

By setting the new `wrap` prop to `true` (either in the opening code fence, as a prop on the `<Code>` component, or in the `defaultProps` config option), word wrapping will be enabled, causing lines that exceed the available width to wrap to the next line. The default value of `false` will instead cause a horizontal scrollbar to appear in such cases.

The word wrap behavior can be further customized using the new `preserveIndent` prop. If `true` (which is the default), wrapped parts of long lines will be aligned with their line's indentation level, making the wrapped code appear to start at the same column. This increases readability of the wrapped code and can be especially useful for languages where indentation is significant, e.g. Python.

If you prefer wrapped parts of long lines to always start at column 1, you can set `preserveIndent` to `false`. This can be useful to reproduce terminal output.
