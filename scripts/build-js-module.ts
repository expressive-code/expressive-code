import { build } from 'tsup'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join, basename } from 'node:path'
import { serializeStringWithSingleQuotes } from './lib/utils'

const moduleFilePath = process.argv[2]
if (!moduleFilePath) throw new Error('Module file path is required')
const outputBaseFilePath = join(process.cwd(), 'dist', basename(moduleFilePath, '.ts'))

// Run tsup to build and minify the JS module
await build({
	entry: [moduleFilePath],
	outExtension: () => ({ js: '.min.js' }),
	format: ['iife'],
	target: 'es2020',
	platform: 'browser',
	dts: true,
	minify: true,
})

// Read the built JS module and generate a `.min.ts` file that exports it as a string
let builtJsModule = readFileSync(`${outputBaseFilePath}.min.js`, 'utf-8')
builtJsModule = builtJsModule.replace(/^"use strict";\n?/, '').trim()
const jsModuleAsString = `export default ${serializeStringWithSingleQuotes(builtJsModule)}\n`
writeFileSync(moduleFilePath.replace(/\.ts$/, '.min.ts'), jsModuleAsString)

// Cleanup: Remove temporary files
unlinkSync(`${outputBaseFilePath}.d.ts`)
unlinkSync(`${outputBaseFilePath}.min.js`)
