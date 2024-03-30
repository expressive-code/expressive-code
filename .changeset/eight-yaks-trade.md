---
'@expressive-code/plugin-collapsible-sections': minor
'@expressive-code/plugin-line-numbers': minor
'@expressive-code/plugin-text-markers': minor
'@expressive-code/plugin-frames': minor
'@expressive-code/plugin-shiki': minor
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
---

- Updates dependencies `hast`, `hastscript` and `hast-util-*` to the latest versions.

  **Breaking change:** Unfortunately, some of the new `hast` types are incompatible with their old versions. If you created custom plugins to manipulate HAST nodes, you may need to update your dependencies as well and probably change some types. For example, if you were using the `Parent` type before, you will probably need to replace it with `Parents` or `Element` in the new version.

- Adds a new `/hast` entrypoint to `@expressive-code/core`, `expressive-code`, `remark-expressive-code` and `astro-expressive-code` to simplify plugin development.

  This new entrypoint provides direct access to the correct versions of HAST types and commonly used tree traversal, querying and manipulation functions. Instead of having to add your own dependencies on libraries like `hastscript`, `hast-util-select` or `unist-util-visit` to your project and manually keeping them in sync with the versions used by Expressive Code, you can now import the internally used functions and types directly from this new entrypoint.
