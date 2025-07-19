# rehype-expressive-code [![NPM version](https://img.shields.io/npm/v/rehype-expressive-code.svg)](https://www.npmjs.com/package/rehype-expressive-code) [![NPM downloads](https://img.shields.io/npm/dm/rehype-expressive-code.svg)](https://npmjs.org/package/rehype-expressive-code)

This package is a [unified](https://github.com/unifiedjs/unified) ([rehype](https://github.com/rehypejs/rehype)) plugin to automatically render code blocks in your markdown / MDX documents using [Expressive Code](https://expressive-code.com/).

## Documentation

[Read the Expressive Code docs](https://expressive-code.com/) to learn more about the features provided by Expressive Code and this integration.

## When should I use this?

When you're using markdown / MDX and want to improve the design and functionality of all contained code blocks using Expressive Code.

## Installation

Read the [installation instructions](https://expressive-code.com/installation/) to learn how to install Expressive Code.

## Detecting code block type and language

When a code block is detected by Expressive Code, the `<code>` element will be wrapped in a `<pre>` (for `block` code) or `<span>` (for `inline` code) element that will contain the following data attributes which can be helpful for conditional
handling in downstream processing (e.g., `CSS`, `react-markdown`, etc.):

- `data-language`: syntax highlighting language (e.g., `js`)
- `data-ec-type`: `block` or `inline`