---
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
'rehype-expressive-code': minor
---

Adds a new `hangingIndent` prop to all code blocks. Thank you @Signum!

By setting this prop to a positive number of columns (either in the opening code fence, as a prop on the `<Code>` component, or in the `defaultProps` config option), you can now further refine the indentation of wrapped lines.

If the prop `preserveIndent` is `true` (which is the default), the `hangingIndent` value is added to the indentation of the original line. If `preserveIndent` is `false`, the value is used as the fixed indentation level of all wrapped lines.

This option only affects how the code block is displayed and does not change the actual code. When copied to the clipboard, the code will still contain the original unwrapped lines.
