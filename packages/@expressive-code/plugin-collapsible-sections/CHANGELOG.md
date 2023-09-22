# @expressive-code/plugin-collapsible-sections

## 0.26.0

### Patch Changes

- Updated dependencies [d2277ba]
- Updated dependencies [d2277ba]
  - @expressive-code/core@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - @expressive-code/core@0.25.0

## 0.24.0

### Minor Changes

- 2c375b1: Migrate i18n functions to string templates with plural support.

  Translated texts including dynamic parts (e.g. a line count) previously used a function syntax. This was convenient to use during plugin development, but made it impossible to use the popular JSON file format as a source of translated texts. To make it easier to integrate Expressive Code, this release gets rid of the function syntax and adds a `formatTemplate` function that understands a simple string template syntax including placeholders and plural support.

  Simple placeholders are written as variable names in curly brackets, e.g. `{variableName}`.

  You can also use conditional placeholders by separating multiple choices with semicolons and optionally adding a condition before each choice, e.g. `{itemCount;1=item;items}` or `{variableName; 0=zero; >0=positive; negative}`.

### Patch Changes

- af3171b: Pass global `styleOverrides` to plugin style resolver functions.

  This allows plugins to access their individual `styleOverrides` extensions even when values were defined at the global config level.

- Updated dependencies [af3171b]
- Updated dependencies [2c375b1]
  - @expressive-code/core@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
  - @expressive-code/core@0.23.0

## 0.22.2

### Patch Changes

- 1916338: Hide summary marker on Safari for collapsible section
  - @expressive-code/core@0.22.2

## 0.22.1

### Patch Changes

- 401b61a: Fix shifted collapsible sections when other plugins add or remove lines
  - @expressive-code/core@0.22.1

## 0.22.0

### Minor Changes

- 0f5258b: Implements the plugin-collapsible-sections plugin, which adds support for collapsed sections of code. These sections hide a number of code lines until the user chooses to expand them. Thanks @birjj for the contribution!

### Patch Changes

- @expressive-code/core@0.22.0
