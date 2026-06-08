---
'astro-expressive-code': minor
---

Adds support for the [Sätteri Markdown processor](https://astro.build/blog/astro-640/) introduced in Astro 6.4.

When your Astro config sets `markdown.processor` to `satteri()` (from `@astrojs/markdown-satteri`), code blocks are now processed by Expressive Code through an equivalent Sätteri HAST plugin instead of the rehype plugin, which Sätteri does not run. The default unified pipeline keeps working exactly as before, and no configuration changes are required to benefit from this.

Thank you @Princesseuh!
