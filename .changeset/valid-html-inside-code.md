---
'@expressive-code/core': minor
'@expressive-code/plugin-frames': minor
'@expressive-code/plugin-line-numbers': minor
'expressive-code': minor
'rehype-expressive-code': minor
'astro-expressive-code': minor
---

Renders code lines and their contents as `span` instead of `div` elements to generate valid HTML.

The `code` and `button` elements only allow phrasing content, so the `div`-based code lines (`div.ec-line`, `div.gutter`, `div.code`), line numbers (`div.ln`) and copy button backgrounds (`button > div`) generated before this change were flagged by HTML validators. All changed elements keep their class names, and the existing styles already define the display properties of these elements, so their visual appearance does not change. Only custom CSS or JS that depends on the exact tag names (e.g. selectors like `div.ec-line`) needs to be updated.
