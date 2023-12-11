---
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
'remark-expressive-code': patch
---

Adds the config option `useStyleReset`.

This option determines if code blocks should be protected against influence from site-wide styles. This protection was always enabled before this release and could not be turned off.

When enabled, Expressive Code uses the declaration `all: revert` to revert all CSS properties to the values they would have had without any site-wide styles. This ensures the most predictable results out of the box.

You can now set this to `false` if you want your site-wide styles to influence the code blocks.
