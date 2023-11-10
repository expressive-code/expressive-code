---
'astro-expressive-code': minor
---

Add `emitExternalStylesheet` option.

Determines if the styles required to display code blocks should be emitted into a separate CSS file rather than being inlined into the rendered HTML of the first code block per page. The generated URL `_astro/ec.{hash}.css` includes a content hash and can be cached indefinitely by browsers.

This is recommended for sites containing multiple pages with code blocks, as it will reduce the overall footprint of the site when navigating between pages.

**Important**: To actually benefit from caching, please ensure that your hosting provider serves the contents of the `_astro` directory as immutable files with a long cache lifetime, e.g. `Cache-Control: public,max-age=31536000,immutable`.

Defaults to `true`.
