---
'@expressive-code/plugin-text-markers': patch
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
'rehype-expressive-code': patch
---

Fixes text marker labels including special characters like `\` by properly escaping CSS variable contents. Thank you @stancl!
