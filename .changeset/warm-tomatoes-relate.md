---
'@expressive-code/plugin-shiki': minor
'rehype-expressive-code': minor
'astro-expressive-code': minor
'expressive-code': minor
---

- Updates Shiki to the latest version (1.26.1).

- Adds new config option `shiki.engine`.

  Allows selecting the Shiki RegExp engine to be used for syntax highlighting. The following options are available:

  - `'oniguruma'`: The default engine that supports all grammars, but requires a target environment with WebAssembly (WASM) support.
  - `'javascript'`: A pure JavaScript engine that does not require WASM. The Shiki team is continuously improving this engine and aims for full compatibility with the Oniguruma engine. Use this engine if your target environment does not support WASM.

- Adds new config option `shiki.langAlias`.

  Allows defining alias names for languages. The keys are the alias names, and the values are the language IDs to which they should resolve.

  The values can either be bundled languages, or additional languages defined in `shiki.langs`.

  For example, setting `langAlias: { mjs: 'javascript' }` allows using `mjs` in your code blocks as an alias for the `javascript` language.
