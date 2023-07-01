import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginFrames, pluginFramesData, PluginFramesOptions } from '../src'

describe('Extracts file name comments from the first code lines', () => {
	test('JS comments without prefix', async () => {
		await expectCodeResult({
			code: `
// test.config.mjs
import { defineConfig } from 'example/config'
				`,
			language: 'js',
			expected: {
				extractedFileName: 'test.config.mjs',
				code: `import { defineConfig } from 'example/config'`,
			},
		})
	})

	test('JS comments with prefix followed by a colon', async () => {
		await expectCodeResult({
			code: `
// Example file: test.config.ts
import { defineConfig } from 'example/config'
				`,
			language: 'ts',
			expected: {
				extractedFileName: 'test.config.ts',
				code: `import { defineConfig } from 'example/config'`,
			},
		})
	})

	test('HTML comments', async () => {
		await expectCodeResult({
			code: `
<!-- Example: src/pages/stars.htm -->
<img src="/assets/stars.png" alt="A starry night sky.">
				`,
			language: 'html',
			expected: {
				extractedFileName: 'src/pages/stars.htm',
				code: `<img src="/assets/stars.png" alt="A starry night sky.">`,
			},
		})
	})

	test('YAML comments', async () => {
		await expectCodeResult({
			code: `
---
# src/pages/post/blog-post.md
layout: ../../layouts/BaseLayout.astro
title: My Blog Post
draft: true
---

This is my in-progress blog post.

No page will be built for this post.
				`,
			language: 'markdown',
			expected: {
				extractedFileName: 'src/pages/post/blog-post.md',
				code: `---
layout: ../../layouts/BaseLayout.astro
title: My Blog Post
draft: true
---

This is my in-progress blog post.

No page will be built for this post.`,
			},
		})
	})

	test('Removes line of whitespace afterwards', async () => {
		await expectCodeResult({
			code: `
// test.config.mjs

import { defineConfig } from 'example/config'
				`,
			language: 'js',
			expected: {
				extractedFileName: 'test.config.mjs',
				code: `import { defineConfig } from 'example/config'`,
			},
		})
	})
})

describe('Leaves comments unlikely to be file names untouched', () => {
	test('Comments after line 4', async () => {
		const code = `
Line 1
Line 2
Line 3
Line 4
// test.config.mjs

import { defineConfig } from 'example/config'
		`
		await expectCodeResult({
			code,
			language: 'js',
			expected: {
				extractedFileName: undefined,
				code: code.trim(),
			},
		})
	})

	test('Links ending with a file name', async () => {
		const code = `
// You can access the file like this:
// https://example.com/test.js
		`
		await expectCodeResult({
			code,
			language: 'js',
			expected: {
				extractedFileName: undefined,
				code: code.trim(),
			},
		})
	})

	test('File extensions not matching the language', async () => {
		const code = `
<head>
  <!-- Local: /public/styles/global.css -->
  <link rel="stylesheet" href="/styles/global.css" />
  <!-- External -->
  <link rel="stylesheet" href="https://example.com/test.css" />
</head>
		`
		await expectCodeResult({
			code,
			language: 'jsx',
			expected: {
				extractedFileName: undefined,
				code: code.trim(),
			},
		})
	})
})

describe('Does not extract file names from comments when disabled or not needed', () => {
	test('When disabled in plugin configuration', async () => {
		const code = `
// test.config.mjs
import { defineConfig } from 'example/config'
		`
		await expectCodeResult({
			code,
			language: 'js',
			options: { extractFileNameFromCode: false },
			expected: {
				extractedFileName: undefined,
				code: code.trim(),
			},
		})
	})
	test('When `title` attribute was found in meta string', async () => {
		const code = `
// test.config.mjs
import { defineConfig } from 'example/config'
		`
		await expectCodeResult({
			code,
			language: 'js',
			meta: 'title="something.js"',
			expected: {
				extractedFileName: 'something.js',
				code: code.trim(),
			},
		})
	})
})

async function expectCodeResult({
	code,
	language,
	meta = '',
	options,
	expected,
}: {
	code: string
	language: string
	meta?: string | undefined
	options?: PluginFramesOptions | undefined
	expected: {
		extractedFileName: string | undefined
		code: string
	}
}) {
	// Create an Expressive Code instance with our plugin
	// and use it to render the test code
	const engine = new ExpressiveCodeEngine({
		plugins: [pluginFrames(options)],
	})
	const { renderedGroupContents } = await engine.render({ code: code.trim(), language, meta })
	expect(renderedGroupContents).toHaveLength(1)
	const codeBlock = renderedGroupContents[0].codeBlock

	// Get the plugin data attached to the code block
	const pluginData = pluginFramesData.getOrCreateFor(codeBlock)

	const actual = {
		extractedFileName: pluginData?.title,
		code: codeBlock.code,
	}

	expect(actual).toMatchObject(expected)
}
