---
'@expressive-code/plugin-text-markers': minor
'astro-expressive-code': minor
'expressive-code': minor
'remark-expressive-code': minor
---

It is now possible to add text labels to marked lines. Thanks @bdenham!

The label text is rendered inside a colorful box in the first line of the marked range. This allows you to reference specific parts of your code in the surrounding text.

To add any text as a label, enclose it in single or double quotes and add it directly after the opening curly brace, followed by a colon (`:`). For example, `ins={"A":6-10}` would mark lines 6 to 10 as inserted and add the label `A` to them.
