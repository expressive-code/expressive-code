# expressive-code [![NPM version](https://img.shields.io/npm/v/expressive-code.svg)](https://www.npmjs.com/package/expressive-code) [![NPM downloads](https://img.shields.io/npm/dm/expressive-code.svg)](https://npmjs.org/package/expressive-code)

A framework-agnostic wrapper package that provides convenient access to the key packages of Expressive Code, an engine for presenting source code on the web.

Instead of having to install and manage multiple Expressive Code packages separately, this package includes both the core engine and all default plugins as dependencies and exports them.

Included packages:

- [@expressive-code/core](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md)
- [@expressive-code/plugin-frames](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md)
- [@expressive-code/plugin-shiki](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-shiki/README.md)
- [@expressive-code/plugin-text-markers](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md)

## When should I use this?

Using this package directly is **only recommended for advanced use cases**, e.g. to create integrations of Expressive Code into other tools and frameworks.

If you just want to render code blocks on your website, you should use one of the higher-level packages instead, e.g. [`astro-expressive-code`](https://www.npmjs.com/package/astro-expressive-code) or [`rehype-expressive-code`](https://www.npmjs.com/package/rehype-expressive-code) for code blocks in markdown / MDX documents.

## Documentation

[Read the Expressive Code docs](https://expressive-code.com/) to learn more about the features provided by Expressive Code.

## Installation

```bash
npm install expressive-code
```

## Usage example

```js
import { ExpressiveCode, ExpressiveCodeConfig } from 'expressive-code'
import { toHtml } from 'expressive-code/hast'

const ec = new ExpressiveCode()

// Get base styles that should be included on the page
// (they are independent of the rendered code blocks)
const baseStyles = await ec.getBaseStyles()

// Render some example code to AST
const { renderedGroupAst, styles } = await ec.render({
  code: 'console.log("Hello world!")',
  language: 'js',
  meta: '',
})

// Convert the rendered AST to HTML
let htmlContent = toHtml(renderedGroupAst)

// Collect styles and add them before the HTML content
const stylesToPrepend: string[] = []
stylesToPrepend.push(baseStyles)
stylesToPrepend.push(...styles)
if (stylesToPrepend.length) {
  htmlContent = `<style>${[...stylesToPrepend].join('')}</style>${htmlContent}`
}

// Output HTML to the console
console.log(htmlContent)
```
