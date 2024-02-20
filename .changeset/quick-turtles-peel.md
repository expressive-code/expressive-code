---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Adds `ExpressiveCodeBlock.props` property and `defaultProps` config option.

The underlying `ExpressiveCodeBlockProps` interface provides a type-safe way for plugins to extend Expressive Code with their own props using declaration merging. Plugins should use the `preprocessMetadata` hook to merge options specified in the opening code fence into their props, making `props` the single source of truth for all per-block options.

In addition, the new `defaultProps` config option allows you to specify default props that will automatically be set on all fenced code blocks and `<Code>` components by the engine. This saves you from having to specify the same props on every block, while still allowing to override them on an individual basis.

The `defaultProps` option also supports an `overridesByLang` property, which allows to override the default props for a specific syntax higlighting language.
