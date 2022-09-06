import { describe, expect, test } from 'vitest'
import { preprocessCode } from '../src/index'

describe('Extracts file name comments from the first lines', () => {
	test('JS comments without prefix', () => {
		expect(
			preprocessCode(
				`
// test.config.mjs
import { defineConfig } from 'example/config'
				`,
				'js',
				true
			)
		).toMatchObject({
			extractedFileName: 'test.config.mjs',
			preprocessedCode: `import { defineConfig } from 'example/config'`,
			removedLineCount: 1,
			removedLineIndex: 0,
		})
	})

	test('JS comments with prefix followed by a colon', () => {
		expect(
			preprocessCode(
				`
// Example file: test.config.ts
import { defineConfig } from 'example/config'
				`,
				'ts',
				true
			)
		).toMatchObject({
			extractedFileName: 'test.config.ts',
			preprocessedCode: `import { defineConfig } from 'example/config'`,
			removedLineCount: 1,
			removedLineIndex: 0,
		})
	})

	test('HTML comments', () => {
		expect(
			preprocessCode(
				`
<!-- Example: src/pages/stars.htm -->
<img src="/assets/stars.png" alt="A starry night sky.">
				`,
				'html',
				true
			)
		).toMatchObject({
			extractedFileName: 'src/pages/stars.htm',
			preprocessedCode: `<img src="/assets/stars.png" alt="A starry night sky.">`,
			removedLineCount: 1,
			removedLineIndex: 0,
		})
	})

	test('YAML comments', () => {
		expect(
			preprocessCode(
				`
---
# src/pages/post/blog-post.md
layout: ../../layouts/BaseLayout.astro
title: My Blog Post
draft: true
---

This is my in-progress blog post.

No page will be built for this post.
				`,
				'markdown',
				true
			)
		).toMatchObject({
			extractedFileName: 'src/pages/post/blog-post.md',
			preprocessedCode: `---
layout: ../../layouts/BaseLayout.astro
title: My Blog Post
draft: true
---

This is my in-progress blog post.

No page will be built for this post.`,
			removedLineCount: 1,
			removedLineIndex: 1,
		})
	})

	test('Removes line of whitespace afterwards', () => {
		expect(
			preprocessCode(
				`
// test.config.mjs

import { defineConfig } from 'example/config'
				`,
				'js',
				true
			)
		).toMatchObject({
			extractedFileName: 'test.config.mjs',
			preprocessedCode: `import { defineConfig } from 'example/config'`,
			removedLineCount: 2,
			removedLineIndex: 0,
		})
	})
})

describe('Leaves comments unlikely to be file names untouched', () => {
	test('Comments after line 4', () => {
		const sampleCode = `
Line 1
Line 2
Line 3
Line 4
// test.config.mjs

import { defineConfig } from 'example/config'
		`
		expect(preprocessCode(sampleCode, 'js', true)).toMatchObject({
			extractedFileName: undefined,
			preprocessedCode: sampleCode.trim(),
			removedLineCount: undefined,
			removedLineIndex: undefined,
		})
	})

	test('Links ending with a file name', () => {
		const sampleCode = `
// You can access the file like this:
// https://example.com/test.js
		`
		expect(preprocessCode(sampleCode, 'js', true)).toMatchObject({
			extractedFileName: undefined,
			preprocessedCode: sampleCode.trim(),
			removedLineCount: undefined,
			removedLineIndex: undefined,
		})
	})

	test('File extensions not matching the language', () => {
		expect(
			preprocessCode(
				`
<head>
  <!-- Local: /public/styles/global.css -->
  <link rel="stylesheet" href="/styles/global.css" />
  <!-- External -->
  <link rel="stylesheet" href="https://example.com/test.css" />
</head>
				`,
				'jsx',
				true
			)
		).toMatchObject({
			extractedFileName: undefined,
			preprocessedCode: `<head>
  <!-- Local: /public/styles/global.css -->
  <link rel="stylesheet" href="/styles/global.css" />
  <!-- External -->
  <link rel="stylesheet" href="https://example.com/test.css" />
</head>`,
			removedLineCount: undefined,
			removedLineIndex: undefined,
		})
	})
})
