---
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
'rehype-expressive-code': patch
---

Prevents the default [style reset](https://expressive-code.com/reference/configuration/#usestylereset) from interfering with more complex SVGs inside Expressive Code blocks. Now, not only `path` elements, but all SVGs and their contents are excluded from the reset. Thank you @xt0rted!
