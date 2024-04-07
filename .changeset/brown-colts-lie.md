---
'@expressive-code/core': minor
---

Adds a `data-language` attribute to the `<pre>` element of rendered code blocks.

The value is set to code block's syntax highlighting language as specified in the opening code fence or `<Code lang="...">` attribute (e.g. `js` or `md`).

If a code block has no language specified, it will default to `plaintext`.

You can use this attribute to apply styles to code blocks based on their language.
