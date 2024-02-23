# Expressive Code

Expressive Code is an engine for presenting source code on the web, aiming to make your code easy to understand and visually stunning.

On top of accurate syntax highlighting powered by the same engine as VS Code, Expressive Code allows you to annotate code blocks using text markers, diff highlighting, code editor & terminal window frames, and more.

All annotations are based on a powerful plugin architecture that allows you to extend the functionality of Expressive Code with your own custom annotations.

Expressive Code doesn't depend on any client-side framework, is built with performance in mind and designed to be as lightweight as possible.

No matter if you’re writing a blog, guide, or a full documentation website, Expressive Code will help you make your code examples stand out.

## Documentation

[Read the Expressive Code docs](https://expressive-code.com/) to learn more about the features provided by Expressive Code, which framework integrations are available, and how to use them.

## About this repository

This is a monorepo that contains all packages related to Expressive Code. Click on any of the packages below to jump to the respective subfolder.

### High-level integration packages

- [remark-expressive-code](packages/remark-expressive-code/README.md) [![NPM version](https://img.shields.io/npm/v/remark-expressive-code.svg)](https://www.npmjs.com/package/remark-expressive-code) - A remark plugin that processes all code blocks in markdown and MDX files with Expressive Code.
- [astro-expressive-code](packages/astro-expressive-code/README.md) [![NPM version](https://img.shields.io/npm/v/astro-expressive-code.svg)](https://www.npmjs.com/package/astro-expressive-code) - An Astro integration to automatically render code blocks in any markdown / MDX content on your site with Expressive Code. It also provides a `<Code>` component to render dynamic code blocks.

### Default plugins

- [@expressive-code/plugin-frames](packages/@expressive-code/plugin-frames/README.md) - Surrounds your code blocks with code editor or terminal window frames, depending on the code's language.
- [@expressive-code/plugin-shiki](packages/@expressive-code/plugin-shiki/README.md) - Adds syntax highlighting to your code blocks, using the same engine as VS Code.
- [@expressive-code/plugin-text-markers](packages/@expressive-code/plugin-text-markers/README.md) - Allows adding text markers to your code blocks, highlighting specific parts of the code or indicating additions or removals.

### Additional plugins

- [@expressive-code/plugin-collapsible-sections](packages/@expressive-code/plugin-collapsible-sections/README.md) - Allows marking code sections as collapsed.
- [@expressive-code/plugin-line-numbers](packages/@expressive-code/plugin-line-numbers) - Adds line numbers to your code blocks.

### Low-level packages for integration authors

- [expressive-code](packages/expressive-code/README.md) [![NPM version](https://img.shields.io/npm/v/expressive-code.svg)](https://www.npmjs.com/package/expressive-code) - This bundle package provides convenient access to the Expressive Code core engine and all default plugins.
- [@expressive-code/core](packages/@expressive-code/core/README.md) - The core engine that powers Expressive Code.

## Installation, Configuration & Usage

Read the [installation instructions](https://expressive-code.com/installation/) to learn how to install Expressive Code.

## Contributing

We welcome all contributions! Please read our [contributing guide](CONTRIBUTING.md) to learn about our development process and how to propose bugfixes and improvements.
