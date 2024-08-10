# Inline annotations

Inline annotations allow you to be more precise than full-line annotations and target specific words or character ranges in your code. There are multiple alternatives on how to define your targets, which are outlined below.

## Annotating string matches

```tsx
// [!note:page] This will annotate the word `page` below.
const { page } = Astro.props;

const { page } = Astro.props; // [!note:page] It also works on the same line.

const { page } = Astro.props;
// [!note:page] You can even reverse the default search direction
// and annotate code above an annotation comment by making sure
// it touches the code above while having a line of whitespace below.

const { page } = Astro.props;
// [!note:Astro.props] This even works in a sequence of multiple
// annotation comments, as they are ignored when searching for targets.
// [!ins:page] Due to this rule, this annotation is still considered
// to be directly touching the code above and will target it.

const { page } = Astro.props;
// [!note:"page":-1] In situations where using whitespace to indicate
// an upwards target direction is not possible or desired, you can
// use a negative range specifier like this instead.
const { page } = Astro.props;
// [!ins:"props":-3]
// This will target up to 3 instances of the word "props" before the comment.

// Edge cases

// [!note:"a string:-2] \" containing [!strange contents]":-3]
```

## Annotating a word in the line above

Insert a comment directly below the line you want to annotate. Before or after the annotation tag (e.g. `!note`), or at the end of your annotation contents, add a single `^` marker pointing at any character inside your target word.

This marker syntax will automatically try to expand the target character range to the left and right, stopping at any non-word characters like whitespace, punctuation or brackets.

```mdx
---
title: A page yet unturned
// [!note] ^ This will add a note to the word `page` above.
---

# Test

export const page = { currentPage: 1 };

<h1>Page {page.currentPage}</h1>
{/* [!note] ^ This will also only target the word `page` due to
    the non-word characters `{` and `.` surrounding it. */}

<h1>Page {page.currentPage}</h1>
{/* [!note]   ^ Pointing directly at a non-word character
    between two surrounding words will target
    these words as well (`page.currentPage`). */}

export const content = 'Something something';
// ^ [!note] You can also target words right at the start of a line
//   by placing the `^` caret before the marker tag.

a(); {/*
^ [!note] If you need to target the very first character,
  you can use multi-line comments. */}
```

## Annotating character ranges in the line above

If you need more control about the range of characters to be targeted by an annotation, you can repeat the marker until it matches the desired range (e.g. `^^^^` to target a range of 4 characters above).

```jsx
---
const { page } = Astro.props;
// [!note]       ^^^^^^^^^^^ This note targets `Astro.props`.
---

a('Hello world!');
// ^^^^^^^^^^^^ [!note] The marker can appear before the annotation tag.

a('Hello world!');
// ^^^^^^^^^^^^
// [!note] It's even possible to put a line break after the marker.

// Targeting character ranges also works for other annotation types.
// The next annotation marks `page.currentPage` as inserted.
<h1>Page {page.currentPage}</h1>
// [!ins] ^^^^^^^^^^^^^^^^

// Some annotation types like `@mark`, `@ins` and `@del`
// can also target multiple character ranges at once
<h1>Article "{frontmatter.title}" by {frontmatter.author}</h1>
// [!mark]   ^^^^^^^^^^^^^^^^^^^     ^^^^^^^^^^^^^^^^^^^^

// In case you really only want to target a single character,
// append `!` to the caret to prevent selecting the full word
const typo = 'wronderful'
// [!del]      ^!
```

## Annotating a word in the line below

Insert a comment directly above the line you want to annotate. Before or after the annotation tag (e.g. `!note`), or at the end of your annotation contents, add a single `_` marker pointing at any character inside your target word.

At the end of multi-line comments, you can also use `|` as marker character instead to improve the visual connection between your comment and the target word.

This marker syntax will automatically expand the target character range to the full word, stopping at any non-word characters like whitespace, punctuation or brackets.

```jsx
---
// !note  _ This will add a note to the word `page` below.
const { page } = Astro.props;
---

/* !note   _ This will also work and target `page` below,
             but the distance between the marker and its target
             may make the visual connection unclear. */
<h1>Page {page.currentPage}</h1>

// !note You can also move the marker to the end of the contents
// to eliminate the distance between the marker and its target.
//         _
<h1>Page {page.currentPage}</h1>

// !note In this scenario, you can also use the `|` character
// as marker to improve the visual connection to the target.
//         |
<h1>Page {page.currentPage}</h1>
```

## Annotating character ranges in the line below

If you need more control about the range of characters to be targeted by an annotation, you can repeat the marker until it matches the desired range (e.g. `____` to target a range of 4 characters below).

```jsx
---
// !note         ___________ This note targets `Astro.props`.
const { page } = Astro.props;
---

// ____________ !note The marker can appear before the annotation tag.
a('Hello world!');

// !note It's even possible to put a line break before the marker.
// ____________
a('Hello world!');

// Some annotation types like `!mark`, `!ins` and `!del`
// can also target multiple character ranges at once
// !mark     ___________________     ____________________
<h1>Article "{frontmatter.title}" by {frontmatter.author}</h1>

// In case you really only want to target a single character,
// append `!` to the marker to prevent selecting the full word
// !del        _!
const typo = 'wronderful'
```
