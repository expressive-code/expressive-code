import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginFrames, pluginFramesData, PluginFramesOptions } from '../src'
import { FrameType } from '../src/utils'

describe('Extracts file name comments from the first code lines', () => {
	test('JS comments without prefix', async () => {
		await runPreprocessingTests([
			{
				fileName: 'test.config.mjs',
			},
		])
	})

	test('JS comments with prefix followed by a colon', async () => {
		await runPreprocessingTests([
			{
				fileName: 'test.config.ts',
				commentSyntax: '// Example file: {fileName}',
				language: 'ts',
			},
			{
				fileName: 'test.config.ts',
				commentSyntax: `// Fichier d'exemple : {fileName}`,
				language: 'ts',
			},
		])
	})

	test('HTML comments', async () => {
		const code = `<img src="/assets/stars.png" alt="A starry night sky.">`
		await runPreprocessingTests([
			{
				fileName: './example.html',
				commentSyntax: '<!-- {fileName} -->',
				code,
				language: 'html',
			},
			{
				fileName: 'src/pages/stars.htm',
				commentSyntax: `<!-- Example: {fileName} -->`,
				code,
				language: 'html',
			},
		])
	})

	test('YAML comments', async () => {
		const code = `
---
layout: ../../layouts/BaseLayout.astro
title: My Blog Post
draft: true
---

This is my in-progress blog post.

No page will be built for this post.
		`.trim()
		await runPreprocessingTests([
			{
				fileName: 'src/pages/post/blog-post.md',
				commentSyntax: '# {fileName}',
				commentLine: 2,
				code,
				language: 'markdown',
			},
		])
	})

	test('Windows file paths', async () => {
		const fileName = 'C:\\Users\\Hippotastic\\printrunconf.ini'
		await runPreprocessingTests([
			{
				fileName,
				commentSyntax: '# {fileName}',
				language: 'ini',
			},
			{
				// Test a lowercase path & drive letter as well
				fileName: fileName.toLowerCase(),
				commentSyntax: '# {fileName}',
				language: 'ini',
			},
			{
				fileName,
				// Allow the file name comment to be prefixed
				commentSyntax: '# File: {fileName}',
				language: 'ini',
			},
			{
				// Allow the path to contain environment variables
				fileName: '%AppData%\\npm\\npm.cmd',
				language: 'cmd',
				expected: { frameType: 'code' },
			},
			{
				// Also accept unknown file extensions if it's an absolute path
				fileName: 'c:\\Users\\Hippotastic\\.unknownextension',
				commentSyntax: '# {fileName}',
				language: 'ini',
			},
		])
	})

	const typicalFileNamePatterns = [
		// File names starting with a dot
		'.bashrc',
		'some/path/.gitignore',
		// File names containing path separators, but no spaces
		'path/to/file',
		'path\\to\\file',
		// Relative file paths
		'./test',
		'.\\Temp',
		// Absolute unix file paths
		'/etc/hosts',
		'~/some_file',
		// Windows file paths
		'\\Temp',
		'C:\\Windows\\System32\\drivers\\etc\\hosts',
	]

	test('Typical file name patterns in standalone comments ', async () => {
		const languages = ['sh', 'ps', 'astro']
		const testCases = languages.flatMap((language) =>
			typicalFileNamePatterns.map((fileName) => ({
				fileName,
				language,
			}))
		)
		await runPreprocessingTests(
			testCases.map((testCase) => ({
				commentSyntax: '# {fileName}',
				...testCase,
			}))
		)
	})

	test('Typical file name patterns with prefix in terminal languages', async () => {
		const languages = ['sh', 'ps']
		const testCases = languages.flatMap((language) =>
			typicalFileNamePatterns.map((fileName) => ({
				fileName,
				language,
			}))
		)
		await runPreprocessingTests(
			testCases.map((testCase) => ({
				commentSyntax: '# Example: {fileName}',
				...testCase,
			}))
		)
	})

	test('Removes line of whitespace afterwards', async () => {
		await runPreprocessingTests([
			{
				fileName: 'test.js',
				commentSyntax: '// Example file: {fileName}\n',
			},
		])
	})
})

describe('Differentiates between shell scripts and terminal sessions', () => {
	const shellScriptCases = [
		{
			fileName: '/home/user/startup.sh',
			language: 'sh',
		},
		{
			fileName: '/etc/init.d',
			language: 'shell',
		},
		{
			fileName: '/etc/profile',
			language: 'sh',
		},
		{
			fileName: '~/.bashrc',
			language: 'shell',
		},
		{
			fileName: 'test.ps1',
			language: 'ps',
			code: `function Get-Demo {\n}`,
		},
		{
			fileName: 'test.psm1',
			language: 'powershell',
			code: `function Get-Demo {\n}`,
		},
		{
			fileName: 'test.psd1',
			language: 'powershell',
			code: `function Get-Demo {\n}`,
		},
	]

	test('Uses the "code" frame type for shell scripts with file name titles', async () => {
		await runPreprocessingTests(
			shellScriptCases.map((testCase) => ({
				code: `echo "It works!"`,
				commentSyntax: '',
				meta: `title="${testCase.fileName}"`,
				expected: {
					frameType: 'code',
				},
				...testCase,
			}))
		)
	})

	test('Uses the "code" frame type for shell scripts with file name comments', async () => {
		await runPreprocessingTests(
			shellScriptCases.map((testCase) => ({
				code: `echo "It works!"`,
				commentSyntax: '# {fileName}',
				expected: {
					frameType: 'code',
				},
				...testCase,
			}))
		)
	})

	test('Uses the "code" frame type for shell scripts starting with a shebang', async () => {
		const code = `
#!/bin/sh
echo "Hello!"
		`.trim()
		await expectCodeResult({
			code,
			language: 'sh',
			expected: {
				title: undefined,
				frameType: 'code',
				code,
			},
		})
	})

	test('Uses regular terminal frame type for shell scripts with non-file name titles', async () => {
		await expectCodeResult({
			code: 'npm install expressive-code',
			language: 'sh',
			meta: `title="Installation via NPM"`,
			expected: {
				title: 'Installation via NPM',
				frameType: undefined,
				code: 'npm install expressive-code',
			},
		})
	})

	test('Uses regular terminal frame type for shell scripts with non-file name comments', async () => {
		const code = `
# Installation
npm install expressive-code
		`.trim()
		await expectCodeResult({
			code,
			language: 'sh',
			expected: {
				title: undefined,
				frameType: undefined,
				code,
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
				title: undefined,
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
				title: undefined,
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
				title: undefined,
				code: code.trim(),
			},
		})
	})

	test('Common comments that may be mistaken for file names', async () => {
		const code = `console.log('The comment above is not a file name')`
		const comments = [
			'// v1.0',
			'// v1.0.0-beta.3',
			'// Version: 1.0',
			'// me@example.com',
			'// Copyright/Disclaimer',
			'# Allow: /',
			'# cat /etc/profile',
			'/// <reference types="astro/client" />',
		]
		const languages = ['js', 'sh']
		await runPreprocessingTests(
			languages.flatMap((language) =>
				comments.map((comment) => ({
					fileName: '',
					commentSyntax: comment,
					code,
					language,
					expected: {
						title: undefined,
						code: `${comment}\n${code}`,
					},
				}))
			)
		)
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
				title: undefined,
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
				title: 'something.js',
				code: code.trim(),
			},
		})
	})
	test('When `title` attribute with empty value was found in meta string', async () => {
		const code = `
// test.config.mjs
import { defineConfig } from 'example/config'
		`
		await expectCodeResult({
			code,
			language: 'js',
			meta: 'title=""',
			expected: {
				title: '',
				code: code.trim(),
			},
		})
	})
	test('When `frame` attribute in meta string was set to `none`', async () => {
		const code = `
// test.config.mjs
import { defineConfig } from 'example/config'
		`
		await expectCodeResult({
			code,
			language: 'js',
			meta: 'frame="none"',
			expected: {
				title: undefined,
				frameType: 'none',
				code: code.trim(),
			},
		})
	})
	test('When `frame` attribute in meta string was set to an empty value', async () => {
		const code = `
// test.config.mjs
import { defineConfig } from 'example/config'
		`
		await expectCodeResult({
			code,
			language: 'js',
			meta: 'frame=""',
			expected: {
				title: undefined,
				frameType: 'none',
				code: code.trim(),
			},
		})
	})
})

async function runPreprocessingTests(
	testCases: {
		fileName: string
		commentSyntax?: string | undefined
		commentLine?: number | undefined
		code?: string | undefined
		language?: string | undefined
		meta?: string | undefined
		expected?:
			| {
					title?: string | undefined
					frameType?: FrameType | undefined
					code?: string | undefined
			  }
			| undefined
	}[]
) {
	for (const testCase of testCases) {
		const {
			fileName,
			commentSyntax = '// {fileName}',
			commentLine = 1,
			// Code without filename comment (defaults to some simple JS code)
			code: codeWithoutFileNameComment = `import { defineConfig } from 'example/config'`,
			language = 'js',
			meta = '',
		} = testCase

		const expected = {
			title: fileName,
			code: codeWithoutFileNameComment,
			...testCase.expected,
		}

		const codeLines = codeWithoutFileNameComment.split('\n')
		if (commentSyntax.length) {
			codeLines.splice(commentLine - 1, 0, commentSyntax.replace('{fileName}', fileName))
		}
		const code = codeLines.join('\n')

		await expectCodeResult({
			code,
			language,
			meta,
			expected: {
				...expected,
				title: expected.title,
				code: expected.code ?? codeWithoutFileNameComment,
			},
		})
	}
}

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
		title: string | undefined
		frameType?: FrameType | undefined
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
		title: pluginData?.title,
		frameType: pluginData?.frameType,
		code: codeBlock.code,
	}

	expect(actual).toMatchObject(expected)
}
