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

## Annotating multiple lines below

Sometimes you may want to annotate an entire block of subsequent lines. To do so, add a range modifier to the end of the tag, e.g. `:3` to target the 3 following lines below.

```jsx
// [!mark:3]
console.log('This line will be marked.')
console.log('This one, too.')
console.log('And this one.')

function a() { // [!mark:3]
  return 'This also works';
}
```

## Annotating a 1-n lines above

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
  This note also targets the line above, even without the range suffix.
  This is because there is only whitespace below.
*/

console.log('Test')
// [!note:-1] Comments can also span multiple lines even when using
// the language's single-line comment syntax, as long as all
// continuation lines are also comments.
```

## Standalone annotations

If you want to create an annotation that does not automatically target the line below, either ensure that there is only whitespace below (whitespace is not a valid automatic target range), or add a `:0` modifier to the end of the tag to indicate that it doesn’t target any lines.

Plugins like `note` will display such standalone annotations exactly where the annotation comment was placed, ensure that there is an empty line above and below the comment.

```html
<head>
  <title>{content.title}</title>
  <!-- [!note:0] This annotation has nothing to do with any of the lines
  above or below. This style could be used to explain this location,
  e.g. "Add other head elements here, like styles and meta tags". -->
</head>
```
