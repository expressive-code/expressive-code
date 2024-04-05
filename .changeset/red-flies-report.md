---
'astro-expressive-code': minor
---

Ensures that static assets (styles and JS modules) are prerendered when using SSR adapters. Thank you @alexanderniebuhr!

To achieve this, the previous approach of using `injectRoute` was dropped and the assets are now being handled by the Vite plugin.
