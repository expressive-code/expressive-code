---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Add multi-theme support to the `theme` config option.

You can now pass an array of themes to the `theme` config option of `remark-expressive-code` and `astro-expressive-code`.

This allows you to render each code block in your markdown/MDX documents using multiple themes, e.g. to support light and dark modes on your site.

**Note**: If you use this feature, you will also need to add custom CSS code to your site to ensure that only one theme is visible at any time.

To allow targeting all code blocks of a given theme through CSS, the theme property `name` is used to generate kebap-cased class names in the format `ec-theme-${name}`. For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice, once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.
