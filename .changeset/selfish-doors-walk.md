---
'@expressive-code/plugin-shiki': minor
---

Adds new config option `shiki.injectLangsIntoNestedCodeBlocks`.

By default, the additional languages defined in the `shiki.langs` option are only available in top-level code blocks contained directly in their parent Markdown or MDX document.

Setting the new `shiki.injectLangsIntoNestedCodeBlocks` option to `true` also enables syntax highlighting when a fenced code block using one of your additional `langs` is nested inside an outer `markdown`, `md` or `mdx` code block. Example:

`````md
````md
This top-level Markdown code block contains a nested `my-custom-lang` code block:

```my-custom-lang
This nested code block will only be highlighted using `my-custom-lang`
if `injectLangsIntoNestedCodeBlocks` is enabled.
```
````
`````
