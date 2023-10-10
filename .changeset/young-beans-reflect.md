---
'@expressive-code/plugin-text-markers': patch
'astro-expressive-code': patch
'expressive-code': patch
'remark-expressive-code': patch
---

Fix multiple different inline marker types on the same line. Thanks @7c78!

The logic inside `flattenInlineMarkerRanges` had a flaw that caused various combinations of `mark`, `ins` and `del` inline markers on the same line to fail. This was fixed and more tests were added.
