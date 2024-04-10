# Code comments test document

This document contains code blocks in many popular languages. Each code block includes comments in the language's syntax, and some also include contents that might be misinterpreted as a comment by a naive parser.

The contents of actual comments are wrapped between pairs of `!!!` sequences (e.g. `!!! this is a comment !!!`), which allows tests to verify that the comments are recognized correctly from start to end.

The contents of expressions that might be misinterpreted as comments contain a `XXX` sequence that can be used by tests to verify that the parser does not treat them as comments.

## JavaScript

```js
// !!! separate line !!!
console.log('Hello, world!'); // !!! end of line 1 !!!
/* !!! multi-line comment on its own single line !!! */
console.log('Hello, world!'); /* !!! multi-line comment starting
at the end of a line and spanning multiple lines
after it !!! */ let a = 1; // !!! end of line 2 !!!
/* !!! another multi-line comment
// this is not a separate comment
end of multi-line comment !!! */
let b = `Template strings can span
// multiple lines and contents inside can XXX
look like comments /* although they are not XXX */,
and they can contain ${/* !!! real comments inside
expressions !!! */
// !!! even multiple ones !!!
'nested /* strings XXX */'}`;
```

## TypeScript

```ts
function test(x: number): void {
  // !!! separate line !!!
  console.log('Hello, world!'); // !!! end of line 1 !!!
  /* !!! multi-line comment on its own single line !!! */
  console.log('Hello, world!'); /* !!! multi-line comment starting
  at the end of a line and spanning multiple lines
  after it !!! */ let a = 1 as number; // !!! end of line 2 !!!
  /* !!! another multi-line comment
  // this is not a separate comment
  end of multi-line comment !!! */
  let b: string = `Template strings can span
  // multiple lines and contents inside can XXX
  look like comments /* although they are not XXX */,
  and they can contain ${/* !!! real comments inside
  expressions !!! */
  // !!! even multiple ones !!!
  'nested /* strings XXX */' + x}`;
}
```

## HTML

```html
<!-- !!! separate line !!! -->
<p>Hello, world! XXX
XXX
</p> <!-- !!! end of line 1 !!! -->
<p>Hello, world!</p> <!-- !!! multi-line comment starting
at the end of a line and spanning multiple lines
after it !!! --> <span>Some text</span> <!-- !!! end of line 2 !!! -->
<!-- !!! another multi-line comment
<!-- this is not a separate comment, HTML does not support nesting comments
end of multi-line comment !!! -->
<span>Some text</span>
<script>
  // !!! JS comment in nested <script> element !!!
  console.log('Hello, /* world XXX */!'); /* !!! multi-line comment starting
  at the end of a line and spanning multiple lines
  after it !!! */ let a = 1; // !!! end of line 2 !!!
</script>
<style>
  /* !!! CSS comment in nested <style> element !!! */
</style>
```

## CSS

```css
/* !!! separate line !!! */
body {
  color: black; /* !!! end of line 1 !!! */
  font-size: 2rem; /* !!! multi-line comment starting
  at the end of a line and spanning multiple lines
  after it !!! */ background-color: white; /* !!! end of line 2 !!! */
}
/* !!! another multi-line comment
/* this is not a separate comment, CSS does not support nesting comments
end of multi-line comment !!! */
div {
  /* !!! beginning of line !!! */color: black;
  content: "/* this is not a comment XXX */";
  content: 'and /* this neither XXX */';
}
```

## MD

````md
<!-- !!! separate line !!! -->
# Hello, world! <!-- !!! end of line 1 !!! -->
Some text <!-- !!! multi-line comment starting
at the end of a line and spanning multiple lines
after it !!! --> <span>Some text</span> <!-- !!! end of line 2 !!! -->
// this is not a comment XXX
```js
// !!! comment in nested JS code !!!
return `
<!-- this is not a comment XXX -->
`
```
<!-- !!! back in md !!! -->
````

## MDX

````mdx
{/* !!! separate line !!! */}
# Hello, world! {/* !!! end of line 1 !!! */}
Some text {/* !!! multi-line comment starting
at the end of a line and spanning multiple lines
after it !!! */} <span>Some text</span> {/* !!! end of line 2 !!! */}
// this is not a comment XXX
```js
// !!! comment in nested JS code !!!
return `
{/* this is not a comment XXX */}
`
```
{/* !!! back in mdx !!! */}
````

## YAML

```yml
# !!! separate line !!!
key: value # !!! end of value !!!
list: # !!! end of list start !!!
  - item1 # !!! end of list item !!!
string: "This is a string # XXX and this is not a comment" # !!! end of string !!!
literal:   |
  This is a literal block scalar that can contain
  various "quotes" like 'this',
  and even blank lines: # XXX not a comment

  # Newlines are kept as-is. XXX
# !!! end of block scalar 1 !!!
folded:  >
  This is a folded block scalar that can contain
  various "quotes" like 'this',
  and even blank lines: # XXX not a comment
  
  # also not a comment XXX
  - even
  - things: that look like lists,
    some extra indentation,
  it's all just a long multiline string.
# !!! end of block scalar 2 !!!
a: |2
  # XXX with indentation indicator
b:  |-2
  # XXX with indentation indicator and no end newline
c: |+2
  # XXX with indentation indicator and all end newlines
d:   >2
  # XXX with indentation indicator
e: >-2
  # XXX with indentation indicator and no end newline
f:  >+2
  # XXX with indentation indicator and all end newlines
# !!! end of all block scalars !!!
```

# Todos

- JSX/TSX
- Python
- Ruby
- Shell
- SQL
- JSON
- TOML
- XML
- Java
- C#
- C++
- C
- Swift
- Kotlin
- Rust
