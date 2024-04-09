import { describe, expect, test } from 'vitest'
import { parseComments } from '../src/helpers/comment-parser'

describe('Comment parser', () => {
	describe('Finding comments in JS code', () => {
		test('Single-line comments', () => {
			const code = `
function test(input) { //1.1
	console.log(input); // 1.2
}
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([
				{ outerText: '//1.1', text: '1.1', type: 'single' },
				{ outerText: '// 1.2', text: ' 1.2', type: 'single' },
			])
		})

		test('Multi-line comment', () => {
			const comment = `
	/*
	console.log(input); // 1.2
	*/
			`.trim()
			const code = `
function test(input) {
	${comment}
}
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([
				{
					outerText: comment,
					text: comment.slice(2, -2),
					type: 'multi',
				},
			])
		})

		test('Single-line comment syntax inside a string', () => {
			const code = `
console.log('hi // this is not a comment') // but this is!
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([{ outerText: '// but this is!', text: ' but this is!', type: 'single' }])
		})

		test('Single-line comment syntax inside a string with escaped quotes', () => {
			const code = `
console.log('hi \\')// this is not a comment') // but this is!
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([{ outerText: '// but this is!', text: ' but this is!', type: 'single' }])
		})

		test('Multi-line comment syntax inside a string', () => {
			const code = `
console.log('hi /* this is not a comment */') // but this is!
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([{ outerText: '// but this is!', text: ' but this is!', type: 'single' }])
		})

		test('Actual multi-line comment inside a template string expression', () => {
			const code = `
console.log(\`hi \${/* this is a comment! //ok */ 'mom'}\`) // wow
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([
				{ outerText: '/* this is a comment! //ok */', text: ' this is a comment! //ok ', type: 'multi' },
				{ outerText: '// wow', text: ' wow', type: 'single' },
			])
		})

		test('Template literals with nested template literals', () => {
			const code = `
const item = "coffee"; // but what about tea?
const temp = "hot";
const order = \`I ordered a \${\`\${temp} \${item}\` /* nested comment */
}, /* not a comment */ // neither this
and it was \${\`absolutely \${\`delicious\`}\`}.\`;
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([
				{ outerText: '// but what about tea?', text: ' but what about tea?', type: 'single' },
				{ outerText: '/* nested comment */', text: ' nested comment ', type: 'multi' },
			])
		})

		test('Template literals with complex nested JS code', () => {
			const code = `
const target = 'world'; // Comment 1
console.log(\`Hello \${target}! \${(() => {
	const date = /*}sneaky{*/ new Date(); // Comment 2
	return \`The {date today is \${date.getFullYear()}-\${date.getMonth() + 1}-\${date.getDate()}.\`;
})()}\`) // Comment 3
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([
				{ outerText: '// Comment 1', text: ' Comment 1', type: 'single' },
				{ outerText: '/*}sneaky{*/', text: '}sneaky{', type: 'multi' },
				{ outerText: '// Comment 2', text: ' Comment 2', type: 'single' },
				{ outerText: '// Comment 3', text: ' Comment 3', type: 'single' },
			])
		})

		test('Commented out multi-line comment', () => {
			const code = `
// This multi-line comment has been commented out:
// /*
console.log(someString);
// */
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([
				{ outerText: '// This multi-line comment has been commented out:', type: 'single' },
				{ outerText: '// /*', text: ' /*', type: 'single' },
				{ outerText: '// */', text: ' */', type: 'single' },
			])
		})

		test('Comments in JSX code', () => {
			const multiLineComment = `
		/*
  			Comments can span
			multiple lines.
		*/
			`.trim()
			const code = `
render() {
	return (
		<div>
			<p>Hi!{/* This is a JSX comment! */}</p>
			{${multiLineComment}}
		</div>
	)
}
			`.trim()
			expect(parseComments(code, 'js')).toMatchObject([
				{ outerText: '/* This is a JSX comment! */', text: ' This is a JSX comment! ', type: 'multi' },
				{ outerText: multiLineComment, text: multiLineComment.slice(2, -2), type: 'multi' },
			])
		})
	})

	describe('Finding JSX comments in MDX code', () => {
		test('Single-line comments', () => {
			const code = `
{//}
//1.1
function test(input) {
	console.log(input); // 1.2
}
}
			`.trim()
			expect(parseComments(code, 'mdx')).toMatchObject([
				{ outerText: '//}', text: '}', type: 'single' },
				{ outerText: '//1.1', text: '1.1', type: 'single' },
				{ outerText: '// 1.2', text: ' 1.2', type: 'single' },
			])
		})
		test('Multi-line comment', () => {
			const comment = `
	{/*
	console.log(input); // 1.2
	*/}
			`.trim()
			const code = `
function test(input) {
	${comment}
}
			`.trim()
			expect(parseComments(code, 'mdx')).toMatchObject([
				{
					// TODO: Extend outerText of JSX expressions that only contain a single comment
					//outerText: comment,
					text: comment.slice(3, -3),
					type: 'multi',
				},
			])
		})
	})

	describe('Finding comments in code nested in MDX fenced code blocks', () => {
		test('Comments in nested JS', () => {
			const code = `
{/* 1st JSX comment in MDX */}
# Test // This is not a comment
// This neither
\`\`\`js
function test(input) { //1.1
	console.log(input); // 1.2
}
\`\`\`
// Also not a comment
{/* 2nd JSX comment in MDX */}
			`.trim()
			expect(parseComments(code, 'mdx')).toMatchObject([
				{ text: ' 1st JSX comment in MDX ', type: 'multi' },
				{ outerText: '//1.1', text: '1.1', type: 'single' },
				{ outerText: '// 1.2', text: ' 1.2', type: 'single' },
				{ text: ' 2nd JSX comment in MDX ', type: 'multi' },
			])
		})
		test('Multiple levels of nested code blocks', () => {
			const code = `
{/* 1st JSX comment in MDX */}
# Test // This is not a comment
\`\`\`\`md
// This neither
<!-- 1st HTML comment in MD -->
\`\`\`js
function test(input) { //1.1
	console.log(input); // 1.2
}
\`\`\`
// Also not a comment
<!-- 2nd HTML comment in MD -->
\`\`\`\`
{/* 2nd JSX comment in MDX */}
			`.trim()
			expect(parseComments(code, 'mdx')).toMatchObject([
				{ text: ' 1st JSX comment in MDX ', type: 'multi' },
				{ text: ' 1st HTML comment in MD ', type: 'multi' },
				{ outerText: '//1.1', text: '1.1', type: 'single' },
				{ outerText: '// 1.2', text: ' 1.2', type: 'single' },
				{ text: ' 2nd HTML comment in MD ', type: 'multi' },
				{ text: ' 2nd JSX comment in MDX ', type: 'multi' },
			])
		})
	})
})
