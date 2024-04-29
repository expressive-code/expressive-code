# Full-line annotations

Full-line annotations allow you to add meaning (annotations) to full lines of your code. There are multiple alternatives on how to target specific lines, which are outlined below.

## Annotating the current line

Insert a comment at the end of a non-empty line you want to annotate.

```js
console.log('This line will be marked.') // [!mark]
```

## Annotating a single line below

Insert a comment directly above the line you want to annotate.

```ts
// [!mark]
console.log('This line will be marked.')

// [!note] This adds a note to the line below.
console.log('Test')

/* [!note] You can also use the language's multi-line comment syntax.
           All text will be contained in the annotation. */
console.log('Test')

/*
  [!note]
  Whitespace inside the comments does not matter,
  allowing you to use any formatting you like.
*/
console.log('Test')

// [!note] Comments can also span multiple lines even when using
// the language's single-line comment syntax, as long as all
// continuation lines are also comments.
console.log('Test')
```

## Annotating multiple lines

Sometimes you may want to annotate an entire block of subsequent lines. To do so, add a range modifier to the end of the tag, e.g. `:3` to target the 3 following lines below.

```jsx
// [!mark:3]
console.log('The marked range starts here, as the line above only contains the annotation tag.')
console.log('Lines only containing annotations will be removed from the output.')
console.log('This is the last line of the range.')
console.log('No longer marked.')

function a() { // [!mark:3]
  return 'This range starts on the line above, as the tag is at the end of a non-empty line.';
}
console.log('No longer marked.')
```

## Annotating lines above

Insert a comment directly below the line(s) you want to annotate, and either ensure that there is only whitespace below (whitespace is not a valid automatic target range, so it will then target the line above), or add a negative range modifier to the end of the tag (e.g. `:-1` for the line directly above, or `:-2` for the two lines directly above).

```jsx
console.log('Test')
// [!note:-1] This annotates the full line above.
console.log('Test')
/* [!note:-1] You can also use the language's multi-line comment syntax.
              All text will be contained in the annotation. */

console.log('Test')
/*
  [!note]
  This note also targets the line above, even without the `:-1` range suffix.
  This is because there is only whitespace below.
*/

console.log('Test')
// [!note:-1] Comments can also span multiple lines even when using
// the language's single-line comment syntax, as long as all
// continuation lines are also comments.
```
