# expressive-code

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Installation](#installation)
- [Usage example](#usage-example)
- [API](#api)
  - [`ExpressiveCode`](#expressivecode)

## What is this?

A framework-agnostic wrapper package that provides convenient access to the key packages of Expressive Code, an engine for presenting source code on the web.

Instead of having to install and manage multiple Expressive Code packages separately, this package includes both the core engine and all default plugins as dependencies and exports them.

Included packages:

- [@expressive-code/core](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md)
- [@expressive-code/plugin-frames](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md)
- [@expressive-code/plugin-shiki](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-shiki/README.md)
- [@expressive-code/plugin-text-markers](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md)

## When should I use this?

Using this package directly is **only recommended for advanced use cases**, e.g. to create integrations of Expressive Code into other tools and frameworks.

If you just want to render code blocks on your website, you should use one of the higher-level packages instead, e.g. [`astro-expressive-code`](https://www.npmjs.com/package/astro-expressive-code) or [`remark-expressive-code`](https://www.npmjs.com/package/remark-expressive-code) for code blocks in markdown / MDX documents.

## Installation

```bash
npm install expressive-code
```

## Usage example

```js
import { ExpressiveCode, ExpressiveCodeConfig } from 'expressive-code'
import { toHtml } from 'hast-util-to-html'

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

## API

### `ExpressiveCode`

The main class of `expressive-code`. It extends the [`ExpressiveCodeEngine`](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md#expressivecodeengine) class and adds some configuration options.

In addition to the [options provided by the core engine](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md#expressivecodeengine-constructor), the following options are available:

- `shiki: boolean`

  The Shiki plugin adds syntax highlighting to code blocks.

  This plugin is enabled by default. Set this to `false` to disable it.

- `textMarkers: PluginTextMarkersOptions | boolean`

  The Text Markers plugin allows to highlight lines and inline ranges in code blocks in various styles (e.g. marked, inserted, deleted).

  This plugin is enabled by default. Set this to `false` to disable it.

  You can also configure the plugin by setting this to an [options object](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md#available-plugin-options).

- `frames: PluginFramesOptions | boolean`

  The Frames plugin adds an editor or terminal frame around code blocks, including an optional title displayed as a tab or window caption.

  This plugin is enabled by default. Set this to `false` to disable it.

  You can also configure the plugin by setting this to an [options object](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md#available-plugin-options).
