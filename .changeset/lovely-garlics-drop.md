---
'remark-expressive-code': minor
'astro-expressive-code': minor
---

Add outer wrapper when rendering multiple themes.

When the `theme` option is set to an array containing multiple themes, the rendered code block groups are now wrapped inside `<div class="ec-themes-wrapper">...</div>`. This encapsulates all rendered themes in a single element and thereby ensures their consistent positioning on sites that would otherwise add margins between them due to adjacent sibling combinators.
