import type * as CssTree from '@eslint/css-tree'
// @ts-expect-error The browser bundle is exported without a matching declaration file.
import * as browserRuntime from '@eslint/css-tree/dist/csstree.esm'

const cssTree = browserRuntime as Pick<typeof CssTree, 'fork' | 'generate' | 'parse' | 'walk'>

export const { fork, generate, parse, walk } = cssTree
