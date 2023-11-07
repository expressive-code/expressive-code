# @expressive-code/plugin-frames

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Installation (not required)](#installation-not-required)
- [Usage in markdown / MDX documents](#usage-in-markdown--mdx-documents)
  - [Code editor window frames](#code-editor-window-frames)
  - [Terminal window frames](#terminal-window-frames)
  - [Adding titles (open file tab or terminal window title)](#adding-titles-open-file-tab-or-terminal-window-title)
  - [Overriding frame types](#overriding-frame-types)
- [Configuration](#configuration)
  - [Astro configuration example](#astro-configuration-example)
  - [Next.js configuration example using `@next/mdx`](#nextjs-configuration-example-using-nextmdx)
  - [Available plugin options](#available-plugin-options)
- [Advanced use cases](#advanced-use-cases)
  - [Manual installation](#manual-installation)
  - [Manual usage from the core package](#manual-usage-from-the-core-package)

## What is this?

A default plugin of Expressive Code, an engine for presenting source code on the web.

It renders a window frame around every code block. Depending on the code's language, this frame can look like a code editor (similar to VS Code), or like a terminal window.

Frames can have optional titles, which are either taken from the code block's meta string, or from a file name comment in the first lines of the code.

## When should I use this?

You can use this plugin to render a window frame around your code blocks. For more information, see the [usage examples](#usage-in-markdown--mdx-documents) below.

This plugin is **installed by default** by our higher-level packages like `remark-expressive-code`, so you can start using it in markdown / MDX documents without having to install it first.

## Installation (not required)

No installation is required. This package is **installed by default** by our higher-level packages.

If you are using the core package directly (e.g. because you are writing an integration), see the [Advanced use cases](#advanced-use-cases) section for more information.

## Usage in markdown / MDX documents

If you are using a higher-level integration package like `remark-expressive-code`, frames will automatically be rendered around your code blocks in markdown / MDX documents.

The type of frame that will be rendered (editor window or terminal window) is selected automatically based on the language identifier in your code block's opening fence:

### Code editor window frames

Code blocks will be rendered as a code editor window if their language identifier is not a terminal language (see next section for a list of terminal languages):

````md
```js
console.log('Hello World!')
```
````

### Terminal window frames

Code blocks will be rendered as a terminal window if their language identifier matches one of the supported terminal languages `bash`, `shellscript`, `shell`, `sh`, or `zsh`:

````md
```bash
npm install
```
````

### Adding titles (open file tab or terminal window title)

You can give your frames a title by adding an optional `title="...your title..."` attribute after the language identifier.

The following code block will be rendered as an editor window with an open file tab named `my-test-file.js`:

````md
```js title="my-test-file.js"
console.log('Hello World!')
```
````

Unless turned off in the plugin configuration, you can also add a file name comment in the first lines of your code to set the title. This comment will be removed from the code and shown as the frame's title instead:

````md
```js
// my-test-file.js
console.log('Hello World!')
```
````

### Overriding frame types

By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.

You can use this feature to render a code block using a shell language (e.g. `sh`) as a code editor instead of the default terminal window:

````md
```sh frame="code"
#!/bin/sh
# my-script.sh
echo "This is a script file, not a terminal!"
```
````

The special frame type `none` will always render a plain code block without a frame or title, and leave any file name comments in the code untouched.

## Configuration

When using this plugin through higher-level integration packages, you can configure it by passing options to the higher-level package.

Here are configuration examples for some popular site generators:

### Astro configuration example

We assume that you're using our Astro integration [`astro-expressive-code`](https://www.npmjs.com/package/astro-expressive-code).

In your Astro config file, you can pass options to the frames plugin like this:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import astroExpressiveCode from 'astro-expressive-code'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
  // You can optionally override the plugin's default settings here
  frames: {
    // Example: Hide the "Copy to clipboard" button
    showCopyToClipboardButton: false,
  },
  styleOverrides: {
    // You can optionally override the plugin's default styles here
    frames: {
      shadowColor: '#124',
    },
  },
}

export default defineConfig({
  integrations: [
    astroExpressiveCode(astroExpressiveCodeOptions),
  ],
})
```

### Next.js configuration example using `@next/mdx`

```js
// next.config.mjs
import createMDX from '@next/mdx'
import remarkExpressiveCode from 'remark-expressive-code'

/** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
const remarkExpressiveCodeOptions = {
  // You can optionally override the plugin's default settings here
  frames: {
    // Example: Hide the "Copy to clipboard" button
    showCopyToClipboardButton: false,
  },
  styleOverrides: {
    // You can optionally override the plugin's default styles here
    frames: {
      shadowColor: '#124',
    },
  },
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      // The nested array structure is required to pass options
      // to a remark plugin
      [remarkExpressiveCode, remarkExpressiveCodeOptions],
    ],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
```

### Available plugin options

You can pass the following options to the plugin:

- `extractFileNameFromCode: boolean`

  If `true` (which is the default), and no title was found in the code block's meta string, the plugin will try to find and extract a comment line containing the code block file name from the first 4 lines of the code.

- `showCopyToClipboardButton: boolean`

  If `true` (which is the default), a "Copy to clipboard" button will be shown for each code block.

- `removeCommentsWhenCopyingTerminalFrames: boolean`

  If `true` (which is the default), the "Copy to clipboard" button of terminal window frames will remove comment lines starting with `#` from the copied text.
  
  This is useful to reduce the copied text to the actual commands users need to run, instead of also copying explanatory comments or instructions.

## Advanced use cases

### Manual installation

You only need to install this plugin if you are using the core package `@expressive-code/core` directly. In this case, you can install the plugin like this:

```bash
# Note: This is an advanced usage example!
# You normally don't need to install this package manually,
# it is installed by default by our higher-level packages.
npm install @expressive-code/plugin-frames
```

### Manual usage from the core package

> **Warning**:
> **This is an advanced usage example!** You normally don't need to use the core package directly, or manually add this plugin to the configuration.

```js
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginFrames } from '@expressive-code/plugin-frames'

const ec = new ExpressiveCodeEngine({
  plugins: [
    // Note: If you want to configure the plugin,
    //       you can pass options like this:
    // pluginFrames({ ...your options here... })
    pluginFrames(),
  ],
})

const code = `
// my-test-file.js
const hello = 'World!'
`

const renderResult = await ec.render({
  code: code.trim(),
  language: 'js',
})

// Output results to the console, showing that
// the file name comment was removed from the code:
console.log(renderResult.renderedGroupContents[0].codeBlock.code)
// --> const hello = 'World!'

// If you were to render the returned AST to HTML now,
// it would contain a frame around the code block.
```
