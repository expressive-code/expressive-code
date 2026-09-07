---
'@expressive-code/plugin-collapsible-sections': patch
---

Fixes code lines being dropped and duplicated when a `collapse` range fully contains a range that was listed before it, e.g. `collapse={3-5, 1-8}`. Ranges like this are now skipped, just like any other range that overlaps an already added section.
