---
'remark-expressive-code': patch
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
---

Fixes a11y property `tabindex="0"` being set on non-scrollable code blocks.

Instead of always adding `tabindex="0"` to the `<pre>` element of code blocks, a small JS module is now used to conditionally add the property to scrollable code blocks only. This ensures that scrollable regions can be accessed via keyboard navigation.
