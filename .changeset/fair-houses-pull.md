---
'@expressive-code/core': minor
---

Remove engine properties `configClassName` and `themeClassName`.

The `configClassName` property was previously used to add a config-dependent class name to the CSS selectors used to style code blocks.

As this property was automatically calculated by hashing the configuration object, it introduced a level of unpredictability, which has now been removed in favor of static base styles.

The `themeClassName` property was previously used to add a theme-dependent class name to code blocks. Its format was `ec-theme-<name>`, where `<name>` was the kebab-cased name of the theme.

As code blocks are now styled using CSS variables instead of generating multiple blocks for all themes and attaching class names to them, this property is no longer needed.
