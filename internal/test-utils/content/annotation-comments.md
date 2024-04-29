# Annotation comments

Annotation comments are the recommended way to annotate parts of your code. You can use them to mark important lines, highlight changes, add notes, and more. You can extend this functionality through plugins that provide new annotation names, styles and custom rendering.

Instead of having to count line numbers, inserting them into a long line after the opening code fence, and updating them each time your code changes, annotation comments are designed to be placed right next to the relevant parts of your code while keeping it readable and functional:

````mdx ignore-tags
```js
// [!note] The note explains the `console.log(...)` line
console.log('Some code');
// The next line will be marked as inserted
newCode(); // [!ins]
```
````

During rendering, Expressive Code will extract the annotation comment syntax from your code and convert them to actual annotations, making the output look clean and beautiful:

````mdx
```js
// [!note] The note explains the `console.log(...)` line
console.log('Some code');
// The next line will be marked as inserted
newCode(); // [!ins]
```
````

In the following sections, you will learn how to add annotation comments to your code, what rules they must follow, and how to troubleshoot common issues.

## Annotation tags

Annotation tags are the core of the annotation comment syntax. They are used to define the type of annotation and, optionally, the target of the annotation.

Here are some example tags: `[!mark]`, `[!del:3]`, `[!ins:Astro.props]`

Annotation tags consist of the following parts:

- The **opening sequence** `[!`
- An **annotation name** registered by the installed plugins, e.g. `note`, `mark`, `ins`, etc.
  - For compatibility with the Shiki transformer syntax, the annotation name can optionally be prefixed by the word `code` and a space, e.g. `code note`, `code mark`, `code ins`, etc.
- An **optional search query** preceded by a colon, with the following query types being available:
  - `:simple strings without quotes`
  - `:'single-quoted strings'` (for more complex text with special characters like `:`)
  - `:"double-quoted strings"` (see above)
  - `:/reg(?:ular )?ex(?:pression)?/` (for complex search patterns)
- An **optional target range modifier**, e.g. `:3`, `:-1`, `:0`, etc.
  - If present, it determines how many lines or search query matches before or after the annotation are targeted
  - If omitted, the annotation targets only 1 line or search query match. Depending on the location of the annotation, this may be above, below, or on the line containing the annotation itself
- The **closing sequence** `]`

## Adding annotations to your code

To add annotations to your code, follow these guidelines:

### All annotations must be placed inside comments

This ensures that your code remains valid and functional, even if the annotation comments are removed during rendering.

### Any supported comment syntax can be used

Expressive Code supports most popular programming languages, so you can use the comment syntax that feels best to you and matches your codebase.

Single-line comment syntaxes:

- `// ...` (JS, TS, Java, C, C++, C#, F#, Rust, Go, etc.)
- `# ...` (Python, Perl, Bash, PowerShell, etc.)
- `-- ...` (SQL, Lua, etc.)

Multi-line comment syntaxes:

- `/* ... */` (JS, TS, CSS, Java, C, C++, C#, Rust, Go, SQL, etc.)
- `<!-- ... -->` (HTML, XML)
- `{/* ... */}` or `{ /* ... */ }` (JSX, TSX)
- `(* ... *)` (Pascal, ML, F#, etc.)
- `--[[ ... ]]` (Lua)

Tip: Although Expressive Code allows you to use any of the supported comment syntaxes regardless of the actual language of your code snippet, it is still recommended to use the proper syntax to ensure that your plaintext code remains valid.

Note: Accurately detecting single-line and multi-line comments in all supported programming languages is hard. Using full-blown language parsers would significantly slow down processing and increase the bundle size. To avoid this, Expressive Code uses a simple heuristic to check for a surrounding comment whenever a valid annotation tag is found.

### Comments can be on their own line or next to your code

- Annotation comments can be placed on their own separate line:

  ```js
  ✅ Recognized:
  // [!note] The line below is noteworthy
  console.log('Some code');
  // [!note:-1] Thank you for noticing the line above
  ```

- Comments and code can also share the same line, as long as the comment is either at the beginning or end of the line, and the comment does not touch your code:

  ```js
  ✅ Recognized:
  console.log('Some code'); // [!note] At the end of a code line
  console.log('More code'); /* [!note] Multi-line syntax also works */

  ✅ Recognized:
  /* [!ins] */ console.log('This line will be marked as inserted');

  ❌ Unrecognized:
  console.log('Some code');// [!note] Too close, it touches the code
  /* [!note] This also touches the code -> */console.log('More code');
  console.log('It cannot be /* [!ins] */ in the middle of the code');
  ```

### Annotation tags must be at the beginning

- If the comment spans a single line, the [annotation tag](#annotation-tags) must be placed at the beginning of the comment:

  ```js
  ✅ Recognized:
  // [!note] A note in a single-line comment
  /* [!note] Using multi-line syntax on a single line */

  ❌ Unrecognized:
  // Here, the tag is not at the beginning [!note]
  // - [!note] This also doesn't work due to the dash
  ```

- In multi-line comments, the annotation tag can also be placed at the beginning of any new line inside the comment:

  ```js
  ✅ Recognized:
  /*
    ...some comment contents that are not part of the annotation...
    [!note] This is a note annotation.
  */
  
  ✅ Recognized:
  /**
   * JSDoc-style comments are also supported.
   * [!note] This is a note annotation.
   */

  ❌ Unrecognized:
  /*
    ...some other text... [!note] This does not work.
  */
  ```

### Annotation tags must not touch non-whitespace characters

- Both before and after the annotation tag, there must either be whitespace or the beginning or end of the line:

  ```js
  ✅ Recognized:
  // [!note] One whitespace before and after the tag is great
  //   [!note] You can also use more, either before...
  // [!note]   ...or after the tag

  ❌ Unrecognized:
  //[!note] The tag must not touch the comment delimiter
  // [!note]The content must not touch the tag either
  ```

## Troubleshooting

### Fixing an annotation that doesn't get processed

If an annotation you've added to your code does not get processed by Expressive Code, check if the following conditions are met:

- Does your annotation tag use the [correct syntax](#annotation-tags)?
- Is your annotation tag placed inside a comment that [follows the guidelines](#adding-annotations-to-your-code)?
- Is the plugin that provides the annotation installed and added to your Expressive Code configuration?
- Is the annotation name inside the tag spelled correctly according to the plugin's documentation?

### Opting out of annotation processing

You may want to prevent Expressive Code from processing annotation comments in certain parts of your code. This can be useful if you're writing a guide about using annotation comments themselves, or if the heuristic used by Expressive Code incorrectly recognizes parts of your code as annotation comments.

To opt out, insert a new line in your code that only contains the special tag `[!ignore-tags]` in a comment:

- The base syntax `[!ignore-tags]` will ignore all tags on the next line.
- You can optionally specify the tag names to ignore, e.g. `[!ignore-tags:note,ins]` will ignore the next match of each tag name.
- You can optionally add a target range modifier:
  - This will ignore all tags in the given amount of lines, e.g. `[!ignore-tags:3]` will ignore all tags on the next 3 lines.
  - If tag names were also specified, it will ignore a certain amount of matches, e.g. `[!ignore-tags:note:5]` will ignore the next 5 matches of the `note` tag.

Have a look at the following example, where a sequence that starts a single-line comment is contained inside a string:

```js
❌ Problem:
const code = 'Test: // [!note] Looks like a comment, gets removed and breaks the code';

✅ Solution:
// [!ignore-tags]
const code = 'Test: // [!note] This just remains a string now as expected';
```
