import { describe, expect, test } from 'vitest'
import { preprocessCode, PreprocessCodeOptions, PreprocessCodeResult } from '../src/index'

const expectCodeResult = (input: string, lang: string, options: PreprocessCodeOptions, partialExpectedResult: Partial<PreprocessCodeResult>) => {
	const { code, annotations, ...rest } = partialExpectedResult
	const expectedResult: PreprocessCodeResult = {
		code: code || '',
		annotations: {
			title: undefined,
			lineMarkings: undefined,
			inlineMarkings: undefined,
			...annotations,
		},
		...rest,
	}
	expect(preprocessCode(input, lang, options)).toEqual(expectedResult)
}

describe('Extracts file name comments from the first lines', () => {
	test('JS comments without prefix', () => {
		expectCodeResult(
			`
// test.config.mjs
import { defineConfig } from 'example/config'
				`,
			'js',
			{ extractFileName: true },
			{
				extractedFileName: 'test.config.mjs',
				code: `import { defineConfig } from 'example/config'`,
			}
		)
	})

	test('JS comments with prefix followed by a colon', () => {
		expectCodeResult(
			`
// Example file: test.config.ts
import { defineConfig } from 'example/config'
				`,
			'ts',
			{ extractFileName: true },
			{
				extractedFileName: 'test.config.ts',
				code: `import { defineConfig } from 'example/config'`,
			}
		)
	})

	test('HTML comments', () => {
		expectCodeResult(
			`
<!-- Example: src/pages/stars.htm -->
<img src="/assets/stars.png" alt="A starry night sky.">
				`,
			'html',
			{ extractFileName: true },
			{
				extractedFileName: 'src/pages/stars.htm',
				code: `<img src="/assets/stars.png" alt="A starry night sky.">`,
			}
		)
	})

	test('YAML comments', () => {
		expectCodeResult(
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
			{ extractFileName: true },
			{
				extractedFileName: 'src/pages/post/blog-post.md',
				code: `---
layout: ../../layouts/BaseLayout.astro
title: My Blog Post
draft: true
---

This is my in-progress blog post.

No page will be built for this post.`,
			}
		)
	})

	test('Removes line of whitespace afterwards', () => {
		expectCodeResult(
			`
// test.config.mjs

import { defineConfig } from 'example/config'
				`,
			'js',
			{ extractFileName: true },
			{
				extractedFileName: 'test.config.mjs',
				code: `import { defineConfig } from 'example/config'`,
			}
		)
	})
})

describe('Shifts existing annotations after removing lines', () => {
	test('By -1 when extracting file name comments', () => {
		expectCodeResult(
			`
// test.config.mjs
import test from 'example'
import { defineConfig } from 'example/config'
				`,
			'js',
			{ extractFileName: true, annotations: { lineMarkings: [{ markerType: 'ins', lines: [3] }] } },
			{
				extractedFileName: 'test.config.mjs',
				code: `import test from 'example'
import { defineConfig } from 'example/config'`,
				annotations: {
					lineMarkings: [{ markerType: 'ins', lines: [2] }],
				},
			}
		)
	})

	test('By -2 when removing a line of whitespace afterwards', () => {
		expectCodeResult(
			`
// test.config.mjs

import { defineConfig } from 'example/config'
				`,
			'js',
			{ extractFileName: true, annotations: { lineMarkings: [{ markerType: 'mark', lines: [3] }] } },
			{
				extractedFileName: 'test.config.mjs',
				code: `import { defineConfig } from 'example/config'`,
				annotations: {
					lineMarkings: [{ markerType: 'mark', lines: [1] }],
				},
			}
		)
	})

	test('Removes lines that got deleted from annotations', () => {
		expectCodeResult(
			`
// This is an example
// test.config.mjs

import { defineConfig } from 'example/config'
				`,
			'js',
			{ extractFileName: true, annotations: { lineMarkings: [{ markerType: 'mark', lines: [1, 2, 3, 4] }] } },
			{
				extractedFileName: 'test.config.mjs',
				code: `// This is an example
import { defineConfig } from 'example/config'`,
				annotations: {
					lineMarkings: [{ markerType: 'mark', lines: [1, 2] }],
				},
			}
		)
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
		expectCodeResult(
			sampleCode,
			'js',
			{ extractFileName: true },
			{
				extractedFileName: undefined,
				code: sampleCode.trim(),
			}
		)
	})

	test('Links ending with a file name', () => {
		const sampleCode = `
// You can access the file like this:
// https://example.com/test.js
		`
		expectCodeResult(
			sampleCode,
			'js',
			{ extractFileName: true },
			{
				extractedFileName: undefined,
				code: sampleCode.trim(),
			}
		)
	})

	test('File extensions not matching the language', () => {
		const sampleCode = `
<head>
  <!-- Local: /public/styles/global.css -->
  <link rel="stylesheet" href="/styles/global.css" />
  <!-- External -->
  <link rel="stylesheet" href="https://example.com/test.css" />
</head>
		`
		expectCodeResult(
			sampleCode,
			'jsx',
			{ extractFileName: true },
			{
				extractedFileName: undefined,
				code: sampleCode.trim(),
			}
		)
	})
})
