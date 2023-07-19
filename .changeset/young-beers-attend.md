---
'@expressive-code/plugin-text-markers': minor
'astro-expressive-code': minor
'expressive-code': minor
'remark-expressive-code': minor
---

Add support for `diff`-like syntax and `lang` meta attribute. Thanks for the idea @hirasso!

To mark lines as inserted or deleted, you can now use the widely supported `diff` language as an alternative to adding line numbers to the opening code fence.

You can even specify a separate syntax highlighting language by adding a `lang="..."` attribute to the opening fence. See README.md for more details.
