---
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
'remark-expressive-code': patch
---

Individual code blocks can now be switched to the base theme while an alternate theme is selected on the page level.

Expressive Code differentiates between your base theme (= the first theme in `themes`) and your alternate themes (= any other entries in `themes`). Previously, as soon as an alternate theme was selected on the page level, e.g. by using `<html data-theme="some-theme-name">`, it wasn't possible to switch individual code blocks to the base theme anymore because of selector specificity issues. This has been resolved and block-level overrides should work as expected now.
