# @expressive-code/core

The core package of [Expressive Code](https://expressive-code.com/), an engine for presenting source code on the web.

## Documentation

[Read the Expressive Code docs](https://expressive-code.com/) to learn more about the features provided by Expressive Code.

## When should I use this?

Using this core package directly is **only recommended for advanced use cases**.

Unless you're a plugin or integration author, you should probably use a higher-level package like [`astro-expressive-code`](https://www.npmjs.com/package/astro-expressive-code) or [`rehype-expressive-code`](https://www.npmjs.com/package/rehype-expressive-code) instead of this one.

## Installation

```bash
npm install @expressive-code/core
```

## Usage example

```js
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { toHtml } from '@expressive-code/core/hast'

const ec = new ExpressiveCodeEngine({
  plugins: [
    // Add your plugins here
  ],
})

const baseStyles = await ec.getBaseStyles()
const themeStyles = await ec.getThemeStyles()

const renderResult = await ec.render({
  code: 'console.log("Hello world!")',
  language: 'js',
})

// Output results to the console
console.dir({
  baseStyles,
  themeStyles,
  blockStyles: renderResult.styles,
  blockHtml: toHtml(renderResult.renderedGroupAst),
})
```
