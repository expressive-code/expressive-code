---
'@expressive-code/plugin-shiki': patch
'astro-expressive-code': patch
'expressive-code': patch
'remark-expressive-code': patch
---

Fixes parallel execution of multiple syntax highlighter creations and tasks.

The Shiki plugin now ensures that async tasks like creating syntax highlighters, loading themes or languages are never started multiple times in parallel. This improves performance, reduces memory usage and prevents build errors on large sites.
