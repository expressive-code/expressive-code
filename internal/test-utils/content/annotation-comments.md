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

In the following sections, you will learn what annotation comments consist of, how to add them to your code, and how to troubleshoot common issues.

## Parts of an annotation comment

Annotation comments consist of the following parts:

- The surrounding [comment syntax](#a-supported-comment-syntax-must-be-used) that ensures your code remains valid and functional both with and without the annotation comment.
- An [annotation tag](#annotation-tags) that defines the type of annotation and, optionally, the target of the annotation.
- Optional [annotation content](#annotation-content) to explain the targeted code to the reader, or to provide additional context. This content can span multiple lines.
- Optionally, the next annotation tag or special separator line `---` to [end multi-line content](#ending-multi-line-content), allowing multiple annotations and even regular comments to share the same comment block.

### Annotation tags

Annotation tags are the core of an annotation comment. They are used to define the type of annotation and, optionally, the target of the annotation.

Here are some example tags: `[!mark]`, `[!del:3]`, `[!ins:Astro.props]`

Annotation tags consist of the following parts:

- The **opening sequence** `[!`
- An **annotation name** registered by the installed plugins, e.g. `note`, `mark`, `ins`, etc.
  - For compatibility with the Shiki transformer syntax, the annotation name can optionally be prefixed by the word `code` and a space, e.g. `code note`, `code mark`, `code ins`, etc.
- An **optional search query** preceded by a colon, with the following query types being available:
  - `:simple strings without quotes`
  - `:'single-quoted strings'` (for more complex text with special characters like `:`)
  - `:"double-quoted strings"` (see above)
  - `:/regex|regular expressions?/` (for complex search patterns)
- An **optional target range modifier**, e.g. `:3`, `:-1`, `:0`, etc.
  - If present, it determines how many lines or search query matches before or after the annotation are targeted
  - If omitted, the annotation targets only 1 line or search query match. Depending on the location of the annotation, this may be above, below, or on the line containing the annotation itself
- The **closing sequence** `]`

### Annotation content

Annotation content allows you to add context, explanations, or other information to the annotation.

How this content is processed depends on the renderer provided by the plugin that registered the annotation. For example, the `note` annotation outputs the provided content in a "handwritten note" style alongside the targeted code to explain its purpose:

```js
// [!note] This is a note annotation.
console.log('Some code');

doTheThing(); // [!note] This does the thing!
```

#### Multi-line content

Annotation content can span multiple lines. To achieve this, you can either use a multi-line comment syntax for the annotation, or repeat the same single-line opening comment syntax on each new line:

```js ignore-tags
/*
  [!note] Annotation content inside multi-line comments
  can span multiple lines.

  It can also contain empty lines.
*/
console.log('Test');

// [!note] The same is true for single-line comments
// if they start on their own line and the opening
// comment syntax is repeated on each line like this.
console.log('Test');
```

Note that single-line comments must start on their own line to allow multi-line content. If the comment starts at the end of a line of code, it will be considered a single-line comment, and the annotation content will be limited to that line only.

This allows the following code to be rendered as expected, leaving the `// Output the result` comment intact in the rendered output:

```js ignore-tags
// Initialize the variable
let a = 1;
a++; // [!note] Note how we increment the variable
// Output the result
console.log(a);
```

#### Ending multi-line content

By default, multi-line content ends at the end of its parent comment block. However, it can end earlier in the following cases:

- A new annotation tag is encountered at the beginning of a new line

  This allows you to add multiple annotations in a natural way:

  ```js ignore-tags
  /*
    [!note] The log line below has a note and is inserted.
    [!ins]
  */
  console.log('Test');

  // [!note] This also works with single-line comments.
  // [!ins]
  console.log('Test');
  ```

- The special separator line `---` is encountered on a line by itself

  This allows regular comments to follow the annotation content:

  ```js ignore-tags
  /*
    [!ins]
    [!note] The log line below has a note and is inserted.
    ---
    This is a regular comment that will not get removed
    from the rendered output.
  */
  console.log('Test');

  /*
    Alternative:
    If you don't want to use the separator line, you can
    move your annotations to the end instead.
    [!ins]
    [!note] The log line below has a note and is inserted.
  */
  console.log('Test');
  ```

## Adding annotations to your code

To add annotations to your code, follow these guidelines:

### All annotations must be placed inside comments

This ensures that your code remains valid and functional, even if the annotation comments are removed during rendering.

### A supported comment syntax must be used

Expressive Code supports most popular programming languages, so you can use the comment syntax that feels best to you and matches your codebase.

Single-line comment syntaxes:

- `// ...` (JS, TS, Java, C, C++, C#, F#, Rust, Go, etc.)
- `# ...` (Python, Perl, Bash, PowerShell, etc.)
- `-- ...` (SQL, Lua, etc.)

Multi-line comment syntaxes:

- `/* ... */` (JS, TS, CSS, Java, C, C++, C#, Rust, Go, SQL, etc.)
- `/** ... */` (JSDoc, JavaDoc - the leading `*` of each new line gets stripped)
- `<!-- ... -->` (HTML, XML)
- `{/* ... */}` or `{ /* ... */ }` (JSX, TSX)
- `(* ... *)` (Pascal, ML, F#, etc.)
- `--[[ ... ]]` (Lua)

Tip: Although Expressive Code allows you to use any of the supported comment syntaxes regardless of the actual language of your code snippet, it is still recommended to use the proper syntax to ensure that your plaintext code remains valid.

Note: Accurately detecting single-line and multi-line comments in all supported programming languages is hard. Using full-blown language parsers would significantly slow down processing and increase the bundle size. To avoid this, Expressive Code uses a simpler heuristic to check for a surrounding comment whenever a valid annotation tag is found.

### Annotation tags must be placed at the beginning

- In comments on a single line, the [annotation tag](#annotation-tags) must be placed at the beginning of the comment:

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
    [!ins]
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

### Annotation tags must be surrounded by whitespace

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

### Comments and code on the same line must be separated by whitespace

- If a line contains both an annotation comment and code, there must be at least one whitespace character between them:

  ```js
  ✅ Recognized:
  console.log('Some code'); // [!note] At the end of a code line
  console.log('More code'); /* [!note] Multi-line syntax also works */

  ✅ Recognized:
  /* [!ins] */ console.log('This line will be marked as inserted');

  ❌ Unrecognized:
  console.log('Some code');// [!note] Too close, it touches the code
  /* [!note] This also touches the code -> */console.log('More code');
  ```

### Single-line comments can be chained on the same line

- Although discouraged, it is possible to add multiple annotations on the same line by repeating the opening comment syntax. This feature is only present for compatibility with Shiki's common transformer syntax:

  ```js
  🤔 Discouraged:
  console.log('Hello'); // [!ins] // [!note] This works, but is hard to read

  🤔 Discouraged:
  // [!note] This also works, but is hard to read // [!ins]
  console.log('Hello');

  ✅ Recommended:
  // [!ins]
  // [!note] We recommend placing annotations on their own lines above the code
  console.log('Hello');

  ✅ Recommended:
  // [!note] You can also put one annotation above and one after the code,
  // which is still more readable than chaining them on the same line
  console.log('Hello'); // [!ins]

  ❌ Incorrect:
  console.log('Hello'); // [!note] [!ins] This is all part of the note content
  // [!ins] [!note] And this will be ignored as `ins` does not render content
  console.log('Hello');
  ```

  **Warning:** Using this syntax is discouraged as it can be hard to read and does not look syntactically correct. We recommend placing each annotation on its own line instead.

### Comments must not be placed between code on the same line

- If annotation comments share their line with code, they must either be placed at the beginning or end of the line, but not in the middle:

  ```js
  ✅ Recognized:
  console.log('Some code'); // [!note] At the end of a code line
  console.log('More code'); /* [!note] Multi-line syntax also works */

  ✅ Recognized:
  /* [!ins] */ console.log('This line will be marked as inserted');

  ❌ Unrecognized:
  thisDoes( /* [!note] Code on both sides is not allowed */ ).notWork();
  ```

  This rule improves the heuristic comment detection and prevents false positives, especially in combination with strings.

### Comments spanning multiple lines must not share any lines with code

- When writing comments that use a multi-line comment syntax and actually span multiple lines, the comment must start and end on a line that does not contain any code:

  ```js
  ✅ Recognized:
  /*
    [!note] This is a multi-line comment
    that actually spans multiple lines
  */
  console.log('Some code');

  ✅ Recognized:
  /* [!note] Another multi-line comment
  that actually spans multiple lines */
  console.log('More code');

  ❌ Unrecognized:
  console.log('Nope'); /* [!note] This is not supported
  because the first comment line also contains code */

  ❌ Unrecognized:
  /* [!note] The last comment line must not contain
  any code either */ console.log('Also nope');
  ```

  This rule also improves the heuristic comment detection and prevents false positives.

## Processing logic

When processing your code, Expressive Code will:

- Go through your code line by line, looking for strings that match the annotation comment syntax. If a match is found, it will:
  - Extract the annotation name, optional search query, and optional target range modifier from the annotation tag
  - Ensure that the annotation name is registered by any of the installed plugins. If not, it will skip the tag and continue searching
  - **Handle the current annotation tag if it's inside a single-line comment:** Try to find the beginning sequence of a single-line comment directly before the annotation tag, with no non-whitespace character before and after the beginning sequence. If found, it will:
    - Mark the location of the beginning sequence as beginning of the comment
    - TODO: Support chaining of single-line comments on the same line
    - Mark the end of the line as the current end of the comment (this may change later)
    - Add any text after the annotation tag until the end of the line to the annotation's **content**
    - If there was only whitespace before the beginning of the comment (= the comment was on its own line), try to expand the comment end location and annotation content to all subsequent lines until a line is found that either doesn't start with the same single-line comment beginning sequence (only preceded by optional whitespace characters), that starts with another valid annotation tag, or that has `---` as its only text content.
    - End processing the current annotation tag and continue searching for the next one
  - **Handle the current annotation tag if it's inside a multi-line comment:** No single-line comment was found, so now try to find a matching pair of beginning and ending sequence of a supported multi-line comment syntax around the match:
    - Walk backwards, passing each character into an array of parser functions that are each responsible for one supported comment syntax. If a parser function returns a definite result, which can either be a match or a failure, stop calling this parser.
      - In the JSDoc parser, on the first processed line, allow whitespace and require either a single `*` character or the opening sequence `/**` surrounded by whitespace to be present before the tag. If not, return a failure. If the opening is found, return a match. Otherwise, keep going with all previous lines and expect the same, except that there now can be arbitrary other content between the mandatory `*` and the beginning of the line.
      - In all other parsers, on the first processed line, allow only whitespace or the opening sequence surrounded by whitespace to be present before the tag. If not, return a failure. If the opening is found, return a match. Otherwise, keep going with all previous lines, but now also allow other arbitrary content. If the beginning of the code is reached, return a failure.
    - If none of the parsers returned a match, skip processing the current annotation tag and continue searching for the next one
    - Otherwise, walk forwards, passing each character into a new array of parser functions that are each responsible for one supported multi-line comment syntax. If a parser function returns a definite result, which can either be a match or a failure, stop calling this parser.
      - In the JSDoc parser, on the first processed line, allow arbitrary content or the closing sequence `*/` surrounded by whitespace. If the closing is found, return a match. Otherwise, keep going with all subsequent lines, and either expect whitespace followed by a mantatory `*` and then arbitrary content. If the closing sequence surrounded by whitespace is encountered at any point, return a match. If the end of the code is reached, return a failure.
      - In all other parsers, just accept any content while looking for the closing sequence surrounded by whitespace on all lines. If it is found, return a match. If the end of the code is reached, return a failure.
    - Now filter the backwards and forwards results, removing any non-pairs. If the opening and closing sequences of multiple pairs overlap, only keep the longest sequence (this ensures that we're capturing `{ /* */ }` instead of just the inner `/* */`). Finally, keep only the innermost pair.
    - If no pair was found, skip processing the current annotation tag and continue searching for the next one
    - Otherwise:
      - Check rule "Comments must not be placed between code on the same line"
        - If the comment starts and ends on the same line, and there is non-whitespace content both before and after the comment, skip processing the current annotation tag and continue searching for the next one
      - Check rule "Comments spanning multiple lines must not share any lines with code"
        - If the comment starts and ends on different lines, and there is non-whitespace content either before the start or after the end of the comment, skip processing the current annotation tag and continue searching for the next one
      - Determine the inner bounds of the current annotation and its content
        - Walk backwards from before the annotation tag until either the beginning of the comment or the beginning of the line is reached
        - Walk forwards from after the annotation tag until either another tag after a newline is found, the `---` terminator line with only whitespace around is found, or the end of the comment is reached
- Applying targeting rules
  - ...
- Removing an annotation tag from the code the comment syntax and the 
  - A function that removes any 
    - If the comment was ended by the special `---` terminator line, include it in the outer range to be removed
    - Remove the entire outer range of the comment from the source code
    - Remove any now trailing whitespace from the line where the comment started
    - If removal of the comment caused the starting line to be empty, remove it as well
    - If the comment ended on a different line, and its removal caused the ending line to be empty, remove it as well

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
