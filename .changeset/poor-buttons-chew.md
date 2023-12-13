---
'@expressive-code/plugin-shiki': minor
'remark-expressive-code': minor
'astro-expressive-code': minor
'expressive-code': minor
---

Changes the syntax highlighter used by `plugin-shiki` to Shikiji. Adds a `shiki: { langs: [...] }` option for loading custom languages.

This change should not cause any differences in HTML output as all rendering is done by Expressive Code. The new `langs` option allows registering custom TextMate grammars in JSON form.
