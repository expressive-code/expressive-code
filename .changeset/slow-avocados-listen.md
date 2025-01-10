---
'astro-expressive-code': minor
---

Adds new config option `shiki.engine`.

Allows selecting the Shiki RegExp engine to be used for syntax highlighting. The following options are available:

- `'oniguruma'`: The default engine that supports all grammars, but requires a target environment with WebAssembly (WASM) support.
- `'javascript'`: A pure JavaScript engine that does not require WASM. The Shiki team is continuously improving this engine and aims for full compatibility with the Oniguruma engine. Use this engine if your target environment does not support WASM.
