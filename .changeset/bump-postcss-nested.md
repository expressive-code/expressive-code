---
'@expressive-code/core': patch
'expressive-code': patch
'rehype-expressive-code': patch
'astro-expressive-code': patch
---

Updates `postcss-nested` to v7, which depends on `postcss-selector-parser` v7. This allows package managers to resolve `postcss-selector-parser` 7.1.6 or later, which fixes [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf).
