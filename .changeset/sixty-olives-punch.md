---
'@expressive-code/plugin-collapsible-sections': minor
'@expressive-code/plugin-text-markers': minor
'@expressive-code/plugin-frames': minor
'@expressive-code/plugin-shiki': minor
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Adds `metaOptions` read-only property to `ExpressiveCodeBlock` instances.

This new property contains a parsed version of the code block's `meta` string. This allows plugins to easily access the options specified by users in the opening code fence of a code block, without having to parse the `meta` string themselves.

All official plugins now use this new API to merge any meta options into the new extensible `ExpressiveCodeBlock.props` property.
