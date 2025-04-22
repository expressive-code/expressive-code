---
'astro-expressive-code': patch
---

Improves the error message when the `<Code>` component is being used on a page without having the Astro integration enabled in the project.

Fixes an issue where the deprecated, but still available `theme` option was not being taken into account during SSR bundle trimming.
