---
'@expressive-code/plugin-frames': minor
'astro-expressive-code': minor
'expressive-code': minor
'remark-expressive-code': minor
---

Clean up frontmatter after file name comment extraction.

If a file name comment gets extracted from a code block without a `title` attribute, additional cleanup work is now performed on the surrounding lines:

- If the code block's language supports frontmatter, and the comment was located in a frontmatter block that has now become empty, the empty frontmatter block gets removed.
- If the line following the removed comment (or removed frontmatter block) is empty, it gets removed as well.
