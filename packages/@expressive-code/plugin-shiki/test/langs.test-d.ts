import { describe, test } from 'vitest'
import type { PluginShikiOptions } from '../src'
import html from './assets/html.json'
import markdown from './assets/markdown.json'

// Define the target for our tests and ensure it's used to avoid linter warnings
let langs: PluginShikiOptions['langs'] = []
langs?.reverse()

describe('Type of plugin option `langs`', () => {
	test('Accepts minimal grammar with only `name`, `scopeName` and `patterns`', () => {
		langs = [{ name: 'test', scopeName: 'source.test', patterns: [] }]
	})
	describe('Accepts common language grammars', () => {
		test('HTML', () => {
			// Uses `comment` keys, which are valid,
			// but not included in Shiki's default types
			langs = [html]
		})
		test('Markdown', () => {
			// Uses non-boolean truthy/falsy values for `applyEndPatternLast`,
			// which are valid, but not allowed by Shiki's default types
			langs = [markdown]
		})
	})
})
