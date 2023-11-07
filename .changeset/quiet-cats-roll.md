---
'@expressive-code/plugin-collapsible-sections': minor
'@expressive-code/plugin-text-markers': minor
'@expressive-code/plugin-frames': minor
'@expressive-code/plugin-shiki': minor
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
---

Rendering multiple themes no longer generates duplicate CSS and HTML output.

In previous versions, a full set of CSS styles was generated for each individual theme, and each code block was rendered multiple times to include the HTML for each theme.

In this version, the CSS output has been changed to a single static set of base styles that uses CSS variables to allow efficient switching between themes.

Also, the HTML output for code blocks is now generated only once, and theme-dependent styles are applied using CSS variables.

These changes significantly reduce page size when using multiple themes, especially on pages with many code blocks.

If you have added CSS code to your site that relies on the old output (e.g. by selectively hiding or showing theme-specific code blocks based on their class name), you will need to update it to work with the new output.

> **Note**: Before writing new custom CSS, please consider if you can achieve your desired result out of the box now. For example, if your `themes` option contains one dark and one light theme, the `useDarkModeMediaQuery` option will generate a `prefers-color-scheme` media query for you by default.
