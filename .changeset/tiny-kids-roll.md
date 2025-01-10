---
'astro-expressive-code': minor
---

Adds new config option `shiki.bundledLangs`.

Allows defining a subset of language IDs from the full Shiki bundle that should be available for syntax highlighting.

In server-side rendering (SSR) environments, setting this option to the languages used on your site can reduce bundle size by up to 80%.

If this option is not set, all languages from the full Shiki bundle are available.
