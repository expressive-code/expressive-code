# Standalone annotations

Sometimes you may want to add an annotation that doesn’t target any other specific line, but rather provides additional information right at its location in the code. This is called a standalone annotation.

Plugins can provide custom styling for standalone annotations. For example, using the `note` annotation in standalone mode will show a little blockquote-like note exactly where the comment was placed.

## Marking annotations in your code as standalone

Imagine you want to add a standalone `note` between some lines of code. As `note` supports automatic line targeting, it will try to find a target line surrounding the comment. To stop this from happening and force it to be standalone, you have the following options:

### Surround the annotation comment with empty lines

The automatic line targeting algorithm stops at empty lines, so if the lines directly above and below the annotation comment are empty, it will not find a target and render the annotation in standalone mode:

```html
<head>
  <title>{content.title}</title>

  <!-- [!note] This annotation has nothing to do with any of the lines
  above or below. This style could be used to explain this location,
  e.g. "Add other head elements here, like styles and meta tags". -->

</head>
```

### Add a `:0` modifier to the end of the tag

If you don't want to introduce empty lines into your code, you can add a `:0` modifier to the end of the tag to indicate that it doesn’t target any lines:

```html
<head>
  <title>{content.title}</title>
  <!-- [!note:0] This will also be rendered as a standalone annotation,
  even though there are non-empty lines directly above and below. -->
</head>
```

## Writing future-proof code snippets

Note that how annotations are rendered is ultimately up to the plugin that provides them. Some plugins may ignore any targeted lines and always render annotations as standalone annotations, even if you don't surround them with empty lines or use the `:0` modifier.

However, please keep in mind that plugins are likely to receive updates and evolve over time, so relying on implicit behavior like this may lead to unexpected results in the future.

Even if you discover that it's not required right now to explicitly mark a particular annotation as standalone, it's a good practice to do so anyway to ensure that your code snippets will continue to work as expected in the future.
