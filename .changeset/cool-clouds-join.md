---
'astro-expressive-code': patch
---

Fixes a Vite warning about `emitFile()` usage. Thank you @evadecker and @alexanderniebuhr!

To avoid this warning from being incorrectly triggered, the Vite plugin internally used by `astro-expressive-code` has now been split into two separate plugins, making sure that `emitFile` is only seen by Vite during build.
