---
'astro-expressive-code': minor
---

Makes `astro-expressive-code` compatible with SSR adapters.

To achieve this, the code responsible for loading the optional `ec.config.mjs` file was replaced with a new version that no longer requires any Node.js-specific functionality.
