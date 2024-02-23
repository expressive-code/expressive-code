---
'@expressive-code/plugin-shiki': patch
'remark-expressive-code': patch
'astro-expressive-code': patch
'expressive-code': patch
---

Reverts language loading of `plugin-shiki` to the previous behavior to work around an apparent race condition.
