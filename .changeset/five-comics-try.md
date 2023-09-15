---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Add plugin styles to the `styleOverrides` config option.

So far, this object only contained core styles like colors, fonts, paddings and more. Now, plugins also contribute their own style settings to this object.

For example, if the `frames` plugin is installed, you can now override its `shadowColor` by setting `styleOverrides.frames.shadowColor` to a color value.
