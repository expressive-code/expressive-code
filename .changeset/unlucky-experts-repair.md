---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
---

Add `cascadeLayer` config option.

This new option allows to specify a CSS cascade layer name that should be used for all generated CSS styles.

If you are using [cascade layers](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_layers) on your site to control the order in which CSS rules are applied, set this option to a non-empty string, and Expressive Code will wrap all of its generated CSS styles in a `@layer` rule with the given name.
