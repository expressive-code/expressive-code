# @expressive-code/core

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Installation](#installation)
- [Usage example](#usage-example)
- [Base API](#base-api)
  - [`ExpressiveCodeEngine`](#expressivecodeengine)
  - [`ExpressiveCodeBlock`](#expressivecodeblock)
  - [`ExpressiveCodeBlockOptions`](#expressivecodeblockoptions)
  - [`ExpressiveCodeLine`](#expressivecodeline)
  - [`ExpressiveCodeTheme`](#expressivecodetheme)
- [Annotations](#annotations)
  - [`ExpressiveCodeAnnotation`](#expressivecodeannotation)
  - [`InlineStyleAnnotation`](#inlinestyleannotation)
- [Plugins](#plugins)
  - [Using plugins](#using-plugins)
  - [Writing your own plugins](#writing-your-own-plugins)
  - [Automatic CSS style scoping](#automatic-css-style-scoping)
  - [Accessing theme and style settings from plugins](#accessing-theme-and-style-settings-from-plugins)
  - [Plugin hooks called before rendering](#plugin-hooks-called-before-rendering)
  - [Plugin hooks called during rendering](#plugin-hooks-called-during-rendering)
  - [`ExpressiveCodePlugin`](#expressivecodeplugin)
  - [`AttachedPluginData`](#attachedplugindata)

## What is this?

The core package of Expressive Code, an engine for presenting source code on the web.

## When should I use this?

Using this core package directly is **only recommended for advanced use cases**.

Unless you're a plugin or integration author, you should probably use a higher-level package like `remark-expressive-code` instead of this one.

## Installation

```bash
npm install @expressive-code/core
```

## Usage example

```js
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { toHtml } from 'hast-util-to-html'

const ec = new ExpressiveCodeEngine({
  plugins: [
    // Add your plugins here
  ],
})

const baseStyles = await ec.getBaseStyles()

const renderResult = await ec.render({
  code: 'console.log("Hello world!")',
  language: 'js',
})

// Output results to the console
console.dir({
  baseStyles,
  blockStyles: renderResult.styles,
  blockHtml: toHtml(renderResult.renderedGroupAst),
})
```

## Base API

### `ExpressiveCodeEngine`

The main class of Expressive Code. It is responsible for rendering code blocks and providing access to the theme and other configuration options.

See above for a [usage example](#usage-example).

#### ExpressiveCodeEngine constructor

- ##### `new ExpressiveCodeEngine(config: ExpressiveCodeEngineConfig)`

  Creates a new instance of the Expressive Code engine. We recommend to create it once and then reuse it for all code blocks to avoid unnecessary overhead.

  **Arguments**:

  - `config`
    - `theme?: ExpressiveCodeTheme`

      The color theme that should be used when rendering.

      Defaults to the `github-dark` theme bundled with Shiki.

      See [`ExpressiveCodeTheme`](#expressivecodetheme) for more information, including how to load your own themes.

    - `styleOverrides: Partial<UnresolvedCoreStyleSettings<CoreStyleSettings>>`

      An optional set of style overrides that can be used to customize the appearance of the rendered code blocks without having to write custom CSS. You can customize core colors, fonts, paddings and more.

      If any of the settings are not given, default values will be used or derived from the theme, as seen in the exported `coreStyleSettings` object.

      **Note**: If your site uses CSS variables for styling, you can also use these overrides to replace any core style with a CSS variable reference, e.g. `var(--your-css-var)`.

    - `plugins?: (ExpressiveCodePlugin | ExpressiveCodePlugin[])[]`

      An optional array of plugins that should be used when rendering code blocks.

      To add a plugin, import its initialization function and call it inside this array.

      If the plugin has any configuration options, you can pass them to the initialization function as an object containing your desired property values.

      If any nested arrays are found inside the `plugins` array, they will be flattened before processing.

#### ExpressiveCodeEngine instance properties

- ##### `theme: ExpressiveCodeTheme`

  The theme passed to the [constructor](#new-expressivecodeengineconfig-expressivecodeengineconfig).

- ##### `styleOverrides: Partial<UnresolvedCoreStyleSettings<CoreStyleSettings>>`

  The optional style overrides passed to the [constructor](#new-expressivecodeengineconfig-expressivecodeengineconfig).

- ##### `coreStyles: ResolvedCoreStyles`

  The resolved set of core styles that are used when rendering code blocks.

- ##### `plugins: readonly ExpressiveCodePlugin[]`

  The plugins passed to the [constructor](#new-expressivecodeengineconfig-expressivecodeengineconfig).

- ##### `configClassName: string`

  This class name is used by Expressive Code when rendering its wrapper element around all code block groups.

  Its format is `ec-<hash>`, where `<hash>` is calculated based on the config options that were passed to the class constructor. This allows you to render multiple code blocks with different configurations on the same page without having to worry about CSS conflicts.

  Non-global CSS styles returned by the `getBaseStyles` and `render` methods are scoped automatically using this class name.

  **Note**: If you want to target all code blocks in CSS, you will probably want to use the non-config-dependent default class `expressive-code` instead, which is also added to all wrapper elements.

#### ExpressiveCodeEngine instance methods

- ##### `async render(input: RenderInput, options?: RenderOptions)`

  Renders the given code block(s) and returns the rendered AST, the rendered code block contents after all transformations have been applied, and a set of non-global CSS styles required by the rendered code blocks.

  In Expressive Code, all processing of your code blocks and their metadata is performed by plugins. To render markup around lines or inline ranges of characters, the `render` method calls the hook functions registered by all added plugins.

  See [Plugin hooks called before rendering](#plugin-hooks-called-before-rendering) and [Plugin hooks called during rendering](#plugin-hooks-called-during-rendering) for more information on the available hooks.

  **Arguments**:

  - `input: RenderInput`
    - Can either be an `ExpressiveCodeBlockOptions` object, an `ExpressiveCodeBlock` instance, or an array containing multiple blocks of these types.
  - `options?: RenderOptions`
    - `onInitGroup`: `(groupContents: GroupContents) => void`
      - An optional handler function that can initialize plugin data for the code block group before processing starts.
      - Plugins can provide access to their data by exporting a const set to a `new AttachedPluginData(...)` instance (e.g. `myPluginData`).
      - You can then import the const and set `onInitGroup` to a function that calls `myPluginData.setFor(group, { ...data... })`.

  **Return value**:

  `Promise<{ renderedGroupAst: Parent, renderedGroupContents: RenderedGroupContents, styles: Set<string> }>`

- ##### `async getBaseStyles()`

  Returns a set of global CSS styles required by all code blocks.

  These styles depend on the theme, plugins, and style overrides that were passed to the class constructor.

  > **Warning**:
  > If you are an advanced user who uses the engine directly (e.g. when writing your own integration into a framework), please note that these styles do not get added to the render output automatically.
  >
  > Instead, your integration code must take care of collecting all styles and adding them to the page. For example, you could create a site-wide CSS stylesheet from the base style and insert a link to it, or you could insert the base styles into a `<style>` element.
  >
  > If you are not writing an integration, please consider using a higher-level package like `remark-expressive-code`, which takes care of this for you.

  **Return value**:

  `Promise<string>`

---

### `ExpressiveCodeBlock`

A class representing a single code block that can be rendered by the Expressive Code engine.

#### Usage example

```js
import { ExpressiveCodeBlock } from 'expressive-code';

const codePlaintext = `
// Perform very important calculations
const a = 1 + 2;
`;

const codeBlock = new ExpressiveCodeBlock({
  code: codePlaintext.trim(),
  language: 'js',
});

// Delete the first line and output the remaining code
codeBlock.deleteLine(0)
console.dir(codeBlock.code)
// --> 'const a = 1 + 2;'
```

#### ExpressiveCodeBlock constructor

- `new ExpressiveCodeBlock(options: ExpressiveCodeBlockOptions)`
  
  Creates a new instance of a code block for use with the Expressive Code engine.

  > **Note**:
  > You usually don't need to create code blocks manually. Instead, you can pass `ExpressiveCodeBlockOptions` to the [`render`](#async-renderinput-renderinput-options-renderoptions) method of the `ExpressiveCodeEngine` class, and the engine will create the code blocks for you.
  >
  > Manually creating code blocks may still be useful in some cases, e.g. to allow integration authors to attach custom annotations to code blocks before passing them to the engine, or to attach custom data to a code block.

  **Arguments**:

  - `options: ExpressiveCodeBlockOptions`

    See [`ExpressiveCodeBlockOptions`](#expressivecodeblockoptions).

#### ExpressiveCodeBlock instance properties

- ##### `code: string`
  
  Provides read-only access to the code block's plaintext contents.

- ##### `language: string`

  Allows getting or setting the code block's language.

  Setting this property may throw an error if not allowed in the current [`state`](#state-expressivecodeprocessingstate).

- ##### `meta: string`

  Allows getting or setting the code block's meta string. In markdown or MDX documents, this is the part of the code block's opening fence that comes after the language name.

  Setting this property may throw an error if not allowed in the current [`state`](#state-expressivecodeprocessingstate).

- ##### `state: ExpressiveCodeProcessingState`

  Provides read-only access to the code block's processing state.

  The processing state controls which properties of the code block can be modified. The engine updates this automatically during rendering.

#### ExpressiveCodeBlock instance methods

- ##### `getLine(index: number): ExpressiveCodeLine | undefined`

  Returns the line at the given index, or `undefined` if the index is out of range.

- ##### `getLines(startIndex?: number, endIndex?: number): readonly ExpressiveCodeLine[]`

  Returns a readonly array of lines starting at the given index and ending before the given index (exclusive). The indices support the same syntax as JavaScript's `Array.slice` method.

- ##### `deleteLine(index: number): void`

  Deletes the line at the given index.

  May throw an error if not allowed in the current [`state`](#state-expressivecodeprocessingstate).

- ##### `deleteLines(indices: number[]): void`

  Deletes the lines at the given indices.

  This function automatically sorts the indices in descending order before deleting the lines, so you do not need to worry about indices shifting after deleting a line.

  May throw an error if not allowed in the current [`state`](#state-expressivecodeprocessingstate).

- ##### `insertLine(index: number, textLine: string): ExpressiveCodeLine`

  Inserts a new line at the given index.

  May throw an error if not allowed in the current [`state`](#state-expressivecodeprocessingstate).

- ##### `insertLines(index: number, textLines: string[]): ExpressiveCodeLine[]`

  Inserts multiple new lines at the given index.

  May throw an error if not allowed in the current [`state`](#state-expressivecodeprocessingstate).

---

### `ExpressiveCodeBlockOptions`

An object type that can be passed as input to the [`render`](#async-renderinput-renderinput-options-renderoptions) method of the `ExpressiveCodeEngine` class, or the [`ExpressiveCodeBlock`](#expressivecodeblock) constructor.

#### ExpressiveCodeBlockOptions properties

- ##### `code: string`

  The plaintext contents of the code block.

- ##### `language: string`

  The code block's language.

  Please use a value from Shiki's [list of supported languages](https://github.com/shikijs/shiki/blob/main/docs/languages.md#all-languages) to ensure proper syntax highlighting.

- ##### `meta?: string`

  An optional meta string. In markdown or MDX documents, this is the part of the code block's opening fence that comes after the language name.

- ##### `onInitBlock?: (block: ExpressiveCodeBlock) => void`

  An optional handler function that can initialize plugin data for the code block before processing starts.

  Plugins can provide access to their data by exporting a const set to a `new AttachedPluginData(...)` instance (e.g. `myPluginData`).

  You can then import the const and set `onInitBlock` to a function that calls `myPluginData.setFor(block, { ...data... })`.

---

### `ExpressiveCodeLine`

A class representing a single code line that is part of an `ExpressiveCodeBlock`. Provides access to the line's code plaintext and any line-level and inline annotations.

#### ExpressiveCodeLine constructor

- ##### `new ExpressiveCodeLine(text: string)`

  Creates a new instance of a code line.

  > **Warning**:
  > You should never need to create code lines manually outside of unit tests. Instead, you most likely want to pass code as a string to the [`render`](#async-renderinput-renderinput-options-renderoptions) method of the `ExpressiveCodeEngine` class, and the engine will create code blocks and lines for you.

  **Arguments**:

  - `text: string`
    - The plaintext code of the line.

#### ExpressiveCodeLine instance properties

- ##### `text: string`

  Provides read-only access to the line's plaintext code.

- ##### `parent: ExpressiveCodeBlock | undefined`

  Provides read-only access to the line's parent code block.

  This will only be `undefined` if you created the line manually, which should only be done in unit tests and not in your regular code.

#### ExpressiveCodeLine instance methods

- ##### `getAnnotations(): readonly ExpressiveCodeAnnotation[]`

  Returns a readonly array of all annotations attached to the line.

  This includes both line-level annotations and inline annotations.

- ##### `addAnnotation(annotation: ExpressiveCodeAnnotation): void`

  Adds a new annotation to the line.

  May throw an error if not allowed in the parent block's current [`state`](#state-expressivecodeprocessingstate).

- ##### `deleteAnnotation(annotation: ExpressiveCodeAnnotation): void`

  Deletes an annotation from the line.

  May throw an error if not allowed in the parent block's current [`state`](#state-expressivecodeprocessingstate).

- ##### `editText(columnStart: number | undefined, columnEnd: number | undefined, newText: string): string`

  Edits the line's plaintext code and automatically updates the line's annotations to match the new code.

  You can think of this function like a text editor. It selects the range of characters starting at `columnStart` and ending before `columnEnd` (exclusive) and replaces the selection with `newText`. The indices support the same syntax as JavaScript's `string.slice` method.

  - To **insert text**, set `columnStart` and `columnEnd` to the same column, and `newText` to the text to be inserted at that column.
  - To **replace text**, set `columnStart` and `columnEnd` to the start and end columns of the text to replace, and `newText` to the replacement text.
  - To **delete text**, do the same as above, but set `newText` to an empty string.

  May throw an error if not allowed in the parent block's current [`state`](#state-expressivecodeprocessingstate).

---

### `ExpressiveCodeTheme`

#### ExpressiveCodeTheme constructors

- ##### `new ExpressiveCodeTheme(theme)`

  Loads the given theme for use with Expressive Code. Supports both Shiki and VS Code theme formats.

  > **Note**:
  > As `@expressive-code/core` does not depend on Shiki, this constructor does not support loading themes bundled with Shiki by name (e.g. `dracula`).
  >
  > Higher-level packages like `remark-expressive-code` come with Shiki by default and therefore also support loading Shiki themes by name.

- ##### `ExpressiveCodeTheme.fromJSONString(json: string): ExpressiveCodeTheme`

  This static function can be called without creating an instance. It attempts to parse the given JSON string as a theme, and returns a new `ExpressiveCodeTheme` instance if successful.

  As some themes follow the JSONC format and may contain comments and trailing commas, this method will attempt to strip them before parsing the result.

#### ExpressiveCodeTheme instance properties

- ##### `name: string`

  The name of the theme.

- ##### `type: VSCodeThemeType`

  The type of the theme. This is either `"dark"` or `"light"`.

  > **Note**:
  > Shiki's special `"css"` theme type is not supported by Expressive Code. If you want to use CSS variables for certain styling aspects, have a look at the [`styleOverrides`](#styleoverrides-partialunresolvedcorestylesettingscorestylesettings) property instead, which allows you to override style colors with CSS variables used on your site.

- ##### `colors: VSCodeWorkbenchColors`

  An object containing all colors defined by the theme.

  If the theme does not define all colors, the missing colors will be filled in with default values based on the [theme type](#type-vscodethemetype) using the same logic as VS Code.

- ##### `fg: string`

  The foreground color of the theme.

  This is a shorthand for `colors["editor.foreground"]` and only available to retain compatibility with Shiki themes.

- ##### `bg: string`

  The background color of the theme.

  This is a shorthand for `colors["editor.background"]` and only available to retain compatibility with Shiki themes.

- ##### `semanticHighlighting: boolean`

  Whether the theme supports semantic highlighting. Used by Shiki.

- ##### `tokenColors: unknown`

  An object containing the theme's token colors. Used by Shiki.

- ##### `settings: IShikiTheme['settings']`

  An object containing the theme's settings. Used by Shiki.

## Annotations

In Expressive Code, annotations are used by plugins to attach semantic information to lines or inline ranges of code. They are used to represent things like syntax highlighting, text markers, comments, errors, warnings, and other semantic information.

Annotations must provide a [`render`](#render-nodestotransform-line--parent) function that transforms its contained AST nodes, e.g. by wrapping them in HTML tags. This function is called by the engine when it's time to render the line the annotation has been attached to.

### `ExpressiveCodeAnnotation`

An abstract class representing a single annotation attached to a code line.

You can develop your own annotations by extending this class and providing implementations for its abstract methods. See the implementation of the [`InlineStyleAnnotation`](#inlinestyleannotation) class for an example.

#### ExpressiveCodeAnnotation constructor

> **Note**:
> As an abstract class, `ExpressiveCodeAnnotation` cannot be instantiated directly. You should create a subclass that extends `ExpressiveCodeAnnotation` instead.

#### ExpressiveCodeAnnotation instance properties

- ##### `inlineRange?: ExpressiveCodeInlineRange`

  Provides read-only access to an optional range of columns within the line that this annotation applies to.

    If this is `undefined`, the annotation applies to the entire line.

- ##### `renderPhase?: AnnotationRenderPhase`

  Determines the phase in which this annotation should be rendered (default: `normal`).

  Rendering is done in phases in the following order: `earliest`, `earlier`, `normal`, `later`, `latest`.

  Annotations with the same phase are rendered in the order they were added.
  
  The earlier an annotation is rendered, the more likely it is to be split, modified or wrapped by later annotations. For example, syntax highlighting is rendered in the `earliest` phase to allow other annotations to wrap and modify the highlighted code.

#### ExpressiveCodeAnnotation instance methods

- ##### `render({ nodesToTransform, line }): Parent[]`

  Renders the annotation by transforming the provided AST nodes.

  This function will be called with an array of AST nodes to transform, and is expected to return an array containing the same number of nodes.

  For example, you could use the `hastscript` library to wrap the received nodes in HTML elements.

  **Arguments**:

  - `nodesToTransform: Parent[]`

    The AST nodes to transform.
  
  - `line: ExpressiveCodeLine`

    The line the annotation is attached to.

  **Returns**:

  - `Parent[]`

    The transformed AST nodes. The length of this array must match the length of the `nodesToTransform` array.

    You do not need to create new nodes. You can simply modify the existing nodes in the `nodesToTransform` array and return it.

---

### `InlineStyleAnnotation`

A concrete implementation of [`ExpressiveCodeAnnotation`](#expressivecodeannotation) that allows you to apply inline styles to code.

Used by `@expressive-code/plugin-shiki` to render syntax highlighting.

#### InlineStyleAnnotation constructor

- ##### `new InlineStyleAnnotation(options)`

  Creates a new inline style annotation.

  **Properties of the `options` argument**:

  - `color?: string`

    The color of the annotation. This is expected to be a hex color string, e.g. `#888`. Using CSS variables or other color formats is possible, but prevents automatic color contrast checks from working.

  - `italic?: boolean`

    Whether the annotation should be rendered in italics.

  - `bold?: boolean`

    Whether the annotation should be rendered in bold.

  - `underline?: boolean`

    Whether the annotation should be rendered with an underline.

  - `inlineRange?: ExpressiveCodeInlineRange`

    See [`ExpressiveCodeAnnotation.inlineRange`](#inlinerange-expressivecodeinlinerange).

  - `renderPhase?: AnnotationRenderPhase`

    See [`ExpressiveCodeAnnotation.renderPhase`](#renderphase-annotationrenderphase).

#### InlineStyleAnnotation instance properties

All properties passed to the constructor are available as instance properties.

## Plugins

In Expressive Code, all processing of your code blocks and their metadata is performed by plugins and annotations. To render markup around lines or inline ranges of characters, plugins create annotations and attach them to the target line.

### Using plugins

To add a plugin to your Expressive Code configuration, import its initialization function and call it inside the `plugins` array passed to the [ExpressiveCodeEngine constructor](#expressivecodeengine-constructor).

If the plugin has any configuration options, you can pass them to the initialization function as an object containing your desired property values.

**Example**:

```js
import { ExpressiveCodeEngine } from '@expressive-code/core';
// Import the frames plugin
import { pluginFrames } from '@expressive-code/plugin-frames';

const engine = new ExpressiveCodeEngine({
  plugins: [
    // Add the plugin to the engine configuration
    pluginFrames({
      // Set the plugin's options (if any)
      extractFileNameFromCode: false,
    }),
  ],
});
```

### Writing your own plugins

To write a new plugin, you need to create a **plugin initialization function** that returns an object matching the interface [`ExpressiveCodePlugin`](#expressivecodeplugin).

```js
// my-example-plugin.js
export function pluginExample() {
  return {
    name: 'Example',
    hooks: {
      // Add your hooks here
    },
  }
}
```

If your plugin has any configuration options, you can add a single `options` argument to your initialization function. This argument must be an object type containing the desired configuration properties.

> **Note**:
> Please use sensible default values for all options wherever possible, so that users ideally do not need to pass any options for your plugin to work.

### Automatic CSS style scoping

Plugins can add CSS styles to a document in multiple ways:

- By providing a [`baseStyles`](#basestyles-string--basestylesresolverfn) property in the plugin object returned by the plugin's initialization function.
- By calling the [`addStyles`](#addstyles-css-string--void) function provided to hooks by the engine.

All provided styles will be **scoped by default** to Expressive Code, so they will not affect the rest of the page. This means that you can define styles like `font-weight: 800`, or `del { text-decoration: line-through }`, and they will only apply to code blocks. SASS-like nesting is also supported.

If you explicitly want to add **global styles**, you can use the `@at-root` rule or target `:root`, `html` or `body` in your selectors. Please be careful with global styles, as users may not expect your plugin to contain a style like `body { color: red }` that changes the look of the entire page.

### Accessing theme and style settings from plugins

If you need to access theme colors or core styles to generate your plugin's base styles, you can set `baseStyles` to a function instead of a string. This function will then be called by the engine with a single object argument with the properties `{ theme: ExpressiveCodeTheme; coreStyles: ResolvedCoreStyles }`, which you can then use to generate your styles.

### Plugin hooks called before rendering

After the engine has parsed the input provided to its [`render`](#async-renderinput-renderinput-options-renderoptions) function, it calls a series of hooks that allow plugins to preprocess the input data before rendering.

Plugins can use these hook functions to read and modify the code and metadata, and to add annotations to lines and inline ranges.

#### Hook function context before rendering

All hook functions in this group are called with a single `context` argument, which is an object containing the following properties:

- ##### `codeBlock: ExpressiveCodeBlock`

  The code block that is being rendered.

- ##### `groupContents: { codeBlock: ExpressiveCodeBlock }[]`

  The group contents that are being rendered.

- ##### `theme: ExpressiveCodeTheme`

  The theme that is being used to render the code block.

- ##### `coreStyles: ResolvedCoreStyles`

  The core styles that are being used to render the code block.

- ##### `addStyles: (css: string) => void`

  A function that allows adding CSS styles to the document that contains the rendered code.

  The engine [automatically scopes](#automatic-css-style-scoping) the provided styles to minimize the risk of them affecting the rest of the page.

  > **Note**:
  > If you are **writing a plugin** and want to add the same styles to every block, consider using the `baseStyles` property of the plugin instead. This allows integrations to optionally extract these styles into a separate CSS file.

#### Individual hooks before rendering

The following hooks are called in the order they are listed here:

- ##### `preprocessMetadata`

  Allows preprocessing the code block's `meta` and `language` properties before any plugins can modify the code.

  Plugins are expected to use this hook to remove any of their syntax from the `meta` string. Removed information can either be stored internally or used to create annotations.

  As the code still matches the plaintext in the containing document (e.g. markdown / MDX) at this point, this hook can be used to apply annotations by line numbers.

- ##### `preprocessCode`

  Allows preprocessing the code before any language-specific hooks are run.

  Plugins are expected to use this hook to remove any of their syntax that could disturb annotation plugins like syntax highlighters. Removed information can either be stored internally (e.g. using [`AttachedPluginData`](#attachedplugindata)), or used to create annotations.

  Plugins can also use this hook to insert new code, e.g. to add type information for syntax highlighters, or to provide functionality to include external files into the code block.

- ##### `performSyntaxAnalysis`

  Allows analyzing the preprocessed code and collecting language-specific syntax annotations.

  This hook is used by plugins like `@expressive-code/plugin-shiki` to run the code through syntax highlighters and to create annotations from their returned syntax tokens.

  These annotations are then available to the following hooks and will be used during rendering.

- ##### `postprocessAnalyzedCode`

  Allows postprocessing the code plaintext after collecting syntax annotations.

  Plugins are expected to use this hook to remove any parts from the code that should not be contained in the output. For example, if a plugin added declarations or type information during the [`preprocessCode`](#preprocesscode) hook to provide information to the syntax highlighter, the declarations could now be removed again.

  After this hook has finished processing, the plaintext of all code lines becomes read-only.

- ##### `annotateCode`

  Allows annotating the final code plaintext.

  As the code is read-only at this point, plugins can use this hook to create annotations on lines or inline ranges matching a specific search term.

- ##### `postprocessAnnotations`

  Allows applying final changes to annotations before rendering.

  After this hook has finished processing, all annotations become read-only.

### Plugin hooks called during rendering

After the engine has called all preprocessing hooks (see [Plugin hooks called before rendering](#plugin-hooks-called-before-rendering)), it converts each plaintext code line into a set of AST nodes split at annotation boundaries, and then calls each annotation's [`render`](#render-nodestotransform-line--parent) function to allow them to transform the AST.

Afterwards, it calls a series of hooks that allow plugins to modify the resulting AST of each line, code block, and code block group.

#### Invidual hooks during rendering

- ##### `postprocessRenderedLine?: ExpressiveCodeHook<PostprocessRenderedLineContext>`

  Allows editing the AST of a single line of code after all annotations were rendered.

- ##### `postprocessRenderedBlock?: ExpressiveCodeHook<PostprocessRenderedBlockContext>`

  Allows editing the AST of the entire code block after all annotations were rendered and all lines were postprocessed.

- ##### `postprocessRenderedBlockGroup?: ExpressiveCodeHook<PostprocessRenderedBlockGroupContext>`

  Allows editing the ASTs of all code blocks that were rendered as part of the same group, as well as the AST of the group root element that contains all group blocks.

  Groups are defined by the calling code. For example, a Remark plugin using Expressive Code to render code blocks could provide authors with a way to group related code blocks together.

  > **Note**:
  > Even if a code block is not part of any group, this hook will still be called. Standalone code blocks are treated like a group containing only a single block.

---

### `ExpressiveCodePlugin`

This interface defines the structure of a plugin object.

#### ExpressiveCodePlugin interface properties

- ##### `name: string`

- ##### `baseStyles?: string | BaseStylesResolverFn`

  CSS styles that should be added to every page containing code blocks processed by the engine this plugin was added to.

  The engine's [`getBaseStyles`](#async-getbasestyles) function goes through all registered plugins and collects their base styles provided through this property.

  The engine [automatically scopes](#automatic-css-style-scoping) the provided styles to minimize the risk of them affecting the rest of the page.

  > **Note**:
  > You can set `baseStyles` to a function if you need to [access theme and style settings](#accessing-theme-and-style-settings-from-plugins) to generate your base styles.

- ##### `hooks: ExpressiveCodePluginHooks`

  The plugin's hook functions that should be called by the engine during rendering.

  See [Plugin hooks called before rendering](#plugin-hooks-called-before-rendering) and [Plugin hooks called during rendering](#plugin-hooks-called-during-rendering) for more information on the available hooks.

---

### `AttachedPluginData`

A class that allows plugins to attach custom data to objects like code blocks, and to optionally allow external access to this data in a type-safe manner.

#### Usage example

```ts
// pluginDataExample.ts
import { AttachedPluginData, ExpressiveCodePlugin } from '@expressive-code/core'

export function pluginDataExample(): ExpressiveCodePlugin {
  return {
    name: 'AttachedPluginDataExample',
    hooks: {
      preprocessMetadata: ({ codeBlock }) => {
        // Get a reference to the block's data object
        const blockData = pluginFramesData.getOrCreateFor(codeBlock)

        // Example: Store the meta string in the data object
        // and remove it from the block
        blockData.extractedMeta = codeBlock.meta
        codeBlock.meta = ''
      },
      postprocessRenderedBlock: ({ codeBlock }) => {
        // Try to retrieve the stored title from the block's data object
        const blockData = pluginFramesData.getOrCreateFor(codeBlock)

        // Log the extracted data
        console.dir(blockData)
      },
    },
  }
}

// Define the data object type
export interface PluginFramesData {
  extractedMeta?: string
}

// Create a singleton instance that allows attaching this type of data
// to any object and to retrieve it later.
// Note: Exporting is optional. This can be useful if multiple plugins
//       need to work together.
export const pluginFramesData = new AttachedPluginData<PluginFramesData>(
  // This function initializes the attached data
  // in case nothing was attached to an object yet
  () => ({})
)
```
