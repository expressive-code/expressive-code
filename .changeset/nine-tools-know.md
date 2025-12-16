---
'astro-expressive-code': patch
---

Fixes partially missing styles in the `<Code>` component when using the `addStyles` plugin API function. When custom styles are added to an individual code block group, they are now correctly output after the group's base styles.
