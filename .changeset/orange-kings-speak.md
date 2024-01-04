---
'@expressive-code/plugin-text-markers': patch
'@expressive-code/plugin-shiki': patch
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
'remark-expressive-code': patch
---

Fixes unexpected `InlineStyleAnnotation` behaviors to improve DX for plugin authors.

- Inline styles now use `:where()` in selectors to reduce specificity and make them easier to override.
- When applying multiple overlapping inline styles to the same line, render phases are now properly respected and later styles override earlier ones.
- The `styleVariantIndex` property is no longer required. Inline styles without an index now apply to all style variants.
- The default `InlineStyleAnnotation` render phase is now `normal`. The previous default setting `earliest` is now explicitly applied by `plugin-shiki` instead. This improves the API while still rendering syntax highlighting in the `earliest` phase to allow other annotations to wrap and modify the highlighted code.
