---
'@expressive-code/plugin-frames': minor
'astro-expressive-code': minor
'expressive-code': minor
'remark-expressive-code': minor
---

Add support to override frame types per code block. Thanks @Princesseuh!

By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.
