---
'astro-expressive-code': minor
---

- Adds new config option `shiki.bundledLangs`.

  Allows defining a subset of language IDs from the full Shiki bundle that should be available for syntax highlighting.

  In server-side rendering (SSR) environments, setting this option to the languages used on your site can reduce bundle size by up to 80%.

  If this option is not set, all languages from the full Shiki bundle are available.

- Adds new config option `removeUnusedThemes`.

  In Astro and Starlight, Expressive Code now automatically removes any themes from the bundle that are not used by your `themes` configuration. This reduces the SSR bundle size by over 1 MB.

  This new optimization is enabled by default and does not need to be configured for most sites. If you have an advanced use case that requires access all bundled themes, you can set this option to `false`.
