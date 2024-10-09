import { describe, expect, test } from 'vitest'
import { markdownToHast } from '../src/helpers/markdown'
import { toHtml } from 'hast-util-to-html'

describe('Markdown parsing', () => {
	describe('Inline formatting', () => {
		describe('Supported formats', () => {
			test('*italic*', ({ task }) => {
				md(task.name, '<em>italic</em>')
			})
			test('**bold**', ({ task }) => {
				md(task.name, '<b>bold</b>')
			})
			test('***bolditalic***', ({ task }) => {
				md(task.name, '<b><em>bolditalic</em></b>')
			})
		})

		describe('Formats can be combined, nested and chained', () => {
			test('*italic* **bold** ***bolditalic***', ({ task }) => {
				md(task.name, '<em>italic</em> <b>bold</b> <b><em>bolditalic</em></b>')
			})

			test('*italic**nested-bold**italic*regular', ({ task }) => {
				md(task.name, '<em>italic<b>nested-bold</b>italic</em>regular')
			})
			test('*italic**nested-bold***regular', ({ task }) => {
				md(task.name, '<em>italic<b>nested-bold</b></em>regular')
			})

			test('**bold*nested-italic*bold**regular', ({ task }) => {
				md(task.name, '<b>bold<em>nested-italic</em>bold</b>regular')
			})
			test('**bold*nested-italic***regular', ({ task }) => {
				md(task.name, '<b>bold<em>nested-italic</em></b>regular')
			})

			test('***bolditalic***regular', ({ task }) => {
				md(task.name, '<b><em>bolditalic</em></b>regular')
			})
			test('***bolditalic**italic*regular', ({ task }) => {
				md(task.name, '<b><em>bolditalic</em></b><em>italic</em>regular')
			})
			test('***bolditalic**italic**nested-bold***', ({ task }) => {
				md(task.name, '<b><em>bolditalic</em></b><em>italic<b>nested-bold</b></em>')
			})
			test('***bolditalic*bold**regular', ({ task }) => {
				md(task.name, '<b><em>bolditalic</em></b><b>bold</b>regular')
			})
		})

		describe('Unmatched symbols remain as-is', () => {
			test('Unclosed *italic remains 1 star', ({ task }) => {
				md(task.name, 'Unclosed *italic remains 1 star')
			})
			test('Unclosed **bold remains 2 stars', ({ task }) => {
				md(task.name, 'Unclosed **bold remains 2 stars')
			})
			test('Unclosed ***bolditalic remains 3 stars', ({ task }) => {
				md(task.name, 'Unclosed ***bolditalic remains 3 stars')
			})
		})

		describe('Special spacing rules', () => {
			test('The start of * italic* formatting * sequences * may not be followed by a space', ({ task }) => {
				md(task.name, 'The start of * italic* formatting * sequences * may not be followed by a space')
			})
			test('The end of italic may not have *more than 2 spaces   * before it', ({ task }) => {
				md(task.name, 'The end of italic may not have *more than 2 spaces   * before it')
			})
			test('With ** bold ** formatting ** sequences    **, this limitation does not exist', ({ task }) => {
				md(task.name, 'With <b> bold </b> formatting <b> sequences    </b>, this limitation does not exist')
			})
			test('Same goes for *** bold italic *** sequences', ({ task }) => {
				md(task.name, 'Same goes for <b><em> bold italic </em></b> sequences')
			})
		})
	})

	describe('Inline code', () => {
		test('Basic `inline code` is supported', ({ task }) => {
			md(task.name, 'Basic <code>inline code</code> is supported')
		})
		test('Symbols in `c*od*e ***blocks***` remain as-is', ({ task }) => {
			md(task.name, 'Symbols in <code>c*od*e ***blocks***</code> remain as-is')
		})
		test('Even ***bolditalic `inline code`*** is possible', ({ task }) => {
			md(task.name, 'Even <b><em>bolditalic <code>inline code</code></em></b> is possible')
		})
		test('Unmatched symbols ` remain as-is', ({ task }) => {
			md(task.name, 'Unmatched symbols ` remain as-is')
		})
		test('Double backticks `` can contain ` inside ``', ({ task }) => {
			md(task.name, 'Double backticks <code> can contain ` inside </code>')
		})
		test('Double backticks can contain `` ` `` by adding a `` `separating``, ``space` ``', ({ task }) => {
			md(task.name, 'Double backticks can contain <code>`</code> by adding a <code>`separating</code>, <code>space`</code>')
		})
	})

	describe('URLs', () => {
		test('You can have [URLs with titles](https://example.com) like this', ({ task }) => {
			md(task.name, 'You can have <a href="https://example.com">URLs with titles</a> like this')
		})
		test('These [titles ***can** be* `formatted`](https://example.com) as well', ({ task }) => {
			md(task.name, 'These <a href="https://example.com">titles <b><em>can</em></b><em> be</em> <code>formatted</code></a> as well')
		})
		test('URLs can be **nested in formatting [like *this*](https://example.com)** as well', ({ task }) => {
			md(task.name, 'URLs can be <b>nested in formatting <a href="https://example.com">like <em>this</em></a></b> as well')
		})
	})

	describe('Autolink URLs', () => {
		test('Plain URLs like https://example.com are automatically converted to links', ({ task }) => {
			md(task.name, 'Plain URLs like <a href="https://example.com">https://example.com</a> are automatically converted to links')
		})
		test('They can be **formatted like https://example.com**, too', ({ task }) => {
			md(task.name, 'They can be <b>formatted like <a href="https://example.com">https://example.com</a></b>, too')
		})
		test('Complex URLs like http://localhost:2931/path(x3)(23)/s?q=%40expressive-code#welcome also work', ({ task }) => {
			md(
				task.name,
				[
					'Complex URLs like ',
					'<a href="http://localhost:2931/path(x3)(23)/s?q=%40expressive-code#welcome">',
					'http://localhost:2931/path(x3)(23)/s?q=%40expressive-code#welcome',
					'</a>',
					' also work',
				].join('')
			)
		})
	})

	describe('Escaping', () => {
		test('Single \\ backlashes \\not followed\\ by special characters are kept', ({ task }) => {
			md(task.name, 'Single \\ backlashes \\not followed\\ by special characters are kept')
		})
		test('Backslashes can escape \\*formatting syntax* and \\`code`', ({ task }) => {
			md(task.name, 'Backslashes can escape *formatting syntax* and `code`')
		})
		test('Escape URLs like \\https://example.com to prevent autolinking', ({ task }) => {
			md(task.name, 'Escape URLs like https://example.com to prevent autolinking')
		})
		test('When escaping backslashes, \\\\*formatting* and \\\\`code` work again', ({ task }) => {
			md(task.name, 'When escaping backslashes, \\<em>formatting</em> and \\<code>code</code> work again')
		})
		test('Allow escaped backslashes \\\\https://example.com before autolinks', ({ task }) => {
			md(task.name, 'Allow escaped backslashes \\<a href="https://example.com">https://example.com</a> before autolinks')
		})
	})

	function md(input: string, expected: string) {
		expect(toHtml(markdownToHast(input))).toEqual(expected)
	}
})
