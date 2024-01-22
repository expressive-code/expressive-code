---
'astro-expressive-code': minor
---

Adds a `<Code>` component that can be used to render code blocks with dynamic contents.

In addition to rendering fenced code blocks in markdown & MDX documents, the Expressive Code Astro integration now also provides a `<Code>` component that can be used from `.astro` and `.mdx` pages.

The `<Code>` component provides props like `code`, `lang` or `meta` that allow you to dynamically define a code block's contents. Using this component, you can render code blocks from variables or data coming from external sources like files, databases or APIs.
