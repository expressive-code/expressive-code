---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Adds a new gutter API that allows plugins to render gutter elements before code lines.

Using the new `addGutterElement` API accessible through the hook context argument, plugins can add gutter elements to a code block. The function expects an object matching the new `GutterElement` interface.

During rendering, the engine calls the `renderLine` function of the gutter elements registered by all plugins for every line of the code block. The returned elements are then added as children to the line's gutter container.

**Potentially breaking change:** To properly support all combinations of gutter elements and line wrapping, the rendered HTML tree of code blocks had to be changed. The code contents of each line are now wrapped inside an extra `<div class="code">...</div>` element:

```diff lang="html"
  <div class="ec-line">
+   <div class="code">
      <span style="...">contents</span>
      [...more contents...]
+   </div>
  </div>
```

If gutter elements were added to a code block, an optional `<div class="gutter">...</div>` will be rendered before this new code wrapper:

```diff lang="html"
  <div class="ec-line">
+   <div class="gutter">
+     [...gutter elements...]
+   </div>
    <div class="code">
      <span style="...">contents</span>
      [...more contents...]
    </div>
  </div>
```
