---
'astro-expressive-code': patch
---

Fixes `handleHotUpdate` in the Astro integration blocking the dev server for a very long time when a file is changed on sites with large module graphs
