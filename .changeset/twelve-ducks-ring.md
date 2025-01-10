---
'astro-expressive-code': minor
---

Adds new config option `removeUnusedThemes`.

In Astro and Starlight, Expressive Code now automatically removes any themes from the bundle that are not used by your `themes` configuration. This reduces the SSR bundle size by over 1 MB.

This new optimization is enabled by default and does not need to be configured for most sites. If you have an advanced use case that requires access all bundled themes, you can set this option to `false`.
