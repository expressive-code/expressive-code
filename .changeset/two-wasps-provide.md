---
'astro-expressive-code': minor
---

Adds new config option `shiki.langAlias`.

Allows defining alias names for languages. The keys are the alias names, and the values are the language IDs to which they should resolve.

The values can either be bundled languages, or additional languages defined in `shiki.langs`.

For example, setting `langAlias: { mjs: 'javascript' }` allows using `mjs` in your code blocks as an alias for the `javascript` language.
