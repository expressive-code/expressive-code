// NOTE - tsup code splitting is disabled to avoid re-exports being dropped
// see https://github.com/evanw/esbuild/issues/1737 & https://github.com/evanw/esbuild/issues/1521
// TODO: Consider a different bundler in order to support code-splitting to reduce /dist size (e.g., unbuild)
export * from '@expressive-code/core'
export * from './common'
