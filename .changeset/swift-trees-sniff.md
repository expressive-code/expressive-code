---
'@expressive-code/plugin-collapsible-sections': minor
'@expressive-code/plugin-line-numbers': minor
'@expressive-code/plugin-text-markers': minor
'@expressive-code/plugin-frames': minor
'@expressive-code/plugin-shiki': minor
'remark-expressive-code': minor
'@expressive-code/core': minor
'expressive-code': minor
---

Since this version, all packages are only distributed in modern ESM format, which greatly reduces bundle size.

Most projects should not be affected by this change at all, but in case you still need to import Expressive Code packages into a CommonJS project, you can use the widely supported `await import(...)` syntax.
