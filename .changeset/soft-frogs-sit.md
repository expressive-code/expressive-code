---
'rehype-expressive-code': patch
'astro-expressive-code': patch
---

Fixes an issue where the optional `getBlockLocale` callback function was not called when using the `<Code>` component. Thank you @HiDeoo!

As the parent document's source file path is not available from an Astro component, the `file` property passed to the `getBlockLocale` callback function now contains an additional `url` property that will be set to the value of `Astro.url` in this case.

When determining the locale of a code block, it is recommended to use this new property first, and only fall back to the existing `path` and `cwd` properties if `url` is undefined.
