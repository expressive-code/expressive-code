import { describe, expect, test } from 'vitest'
import { ExpressiveCode } from '@expressive-code/core'
import { textMarkers, textMarkersPluginData } from '../src'
import { MarkerType, markerTypeFromString } from '../src/marker-types'
import { TextMarkersLineAnnotation } from '../src/annotations'

const astroCodeSnippet = `
---
// Your component script here!
import ReactPokemonComponent from '../components/ReactPokemonComponent.jsx';
const myFavoritePokemon = [/* ... */];
---
<!-- HTML comments supported! -->

<h1>Hello, world!</h1>

<!-- Use props and other variables from the component script: -->
<p>My favorite pokemon is: {Astro.props.title}</p>

<!-- Include other components with a \`client:\` directive to hydrate: -->
<ReactPokemonComponent client:visible />

<!-- Mix HTML with JavaScript expressions, similar to JSX: -->
<ul>
  {myFavoritePokemon.map((data) => <li>{data.name}</li>)}
</ul>

<!-- Use a template directive to build class names from multiple strings or even objects! -->
<p class:list={["add", "dynamic", {classNames: true}]} />
`
	.trim()
	.replace(/^\s+/gm, '')

type ExpectedTextMarkerResults = {
	meta: string
	annotations?: {
		lineMarkings?: { markerType: MarkerType; lines: number[] }[]
		plaintextTerms?: { markerType: MarkerType; text: string }[]
		regExpTerms?: { markerType: MarkerType; regExp: RegExp }[]
	}
}

const expectMetaResult = async (input: string, partialExpectedResult: ExpectedTextMarkerResults) => {
	const { meta, annotations, ...rest } = partialExpectedResult
	const expectedResult = {
		meta: meta || '',
		annotations: {
			lineMarkings: [],
			plaintextTerms: [],
			regExpTerms: [],
			...annotations,
		},
		...rest,
	}

	// Create an Expressive Code instance with our plugin
	// and use it to render the test code
	const ec = new ExpressiveCode({
		plugins: [textMarkers()],
	})
	const data = {
		code: astroCodeSnippet,
		language: 'astro',
		meta: input,
	}
	const { renderedGroupContents } = await ec.render(data)
	expect(renderedGroupContents).toHaveLength(1)
	const codeBlock = renderedGroupContents[0].codeBlock

	// Collect all applied full-line text marker annotations in the form expected by the test cases
	const lineMarkings: { markerType: MarkerType; lines: number[] }[] = []
	codeBlock.getLines().forEach((line, lineIndex) => {
		const fullLineAnnotations = line.getAnnotations().filter((annotation) => annotation instanceof TextMarkersLineAnnotation) as TextMarkersLineAnnotation[]
		fullLineAnnotations.forEach((annotation) => {
			const markerType = markerTypeFromString(annotation.markerType)
			if (!markerType) return
			let lineMarkingsEntry = lineMarkings.find((entry) => entry.markerType === markerType)
			if (!lineMarkingsEntry) {
				lineMarkingsEntry = { markerType, lines: [] }
				lineMarkings.push(lineMarkingsEntry)
			}
			lineMarkingsEntry.lines.push(lineIndex + 1)
		})
	})

	// Build actual data using all collected information
	const pluginData = textMarkersPluginData.getOrCreateFor(codeBlock)
	const actual: ExpectedTextMarkerResults = {
		meta: codeBlock.meta,
		annotations: {
			lineMarkings,
			plaintextTerms: pluginData?.plaintextTerms,
			regExpTerms: pluginData?.regExpTerms,
		},
	}

	// Expect actual data to match expected data
	expect(actual).toEqual(expectedResult)
}

const createMarkerRegExp = (input: string) => {
	try {
		return new RegExp(input, 'dg')
	} catch (error) {
		return new RegExp(input, 'g')
	}
}

describe('Leaves unknown contents untouched', () => {
	test('Simple text', async () => {
		await expectMetaResult('twoslash', {
			meta: 'twoslash',
		})
	})

	test('Unknown properties in single or double quotes', async () => {
		await expectMetaResult('yabba="dabba doo!"', {
			meta: 'yabba="dabba doo!"',
		})

		await expectMetaResult("multipass='leeloo dallas'", {
			meta: "multipass='leeloo dallas'",
		})
	})

	test('Unknown properties in curly braces', async () => {
		await expectMetaResult('whoops={13}', {
			meta: 'whoops={13}',
		})

		await expectMetaResult('nothingToSee={1-99}', {
			meta: 'nothingToSee={1-99}',
		})
	})
})

describe('Extracts known properties', () => {
	test('Line markings in curly braces', async () => {
		await expectMetaResult('{2-5}', {
			meta: '',
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [2, 3, 4, 5] }],
			},
		})

		await expectMetaResult('ins={4,10-12}', {
			meta: '',
			annotations: {
				lineMarkings: [{ markerType: 'ins', lines: [4, 10, 11, 12] }],
			},
		})

		await expectMetaResult('hello {2-5} world', {
			meta: 'hello world',
			annotations: {
				lineMarkings: [{ markerType: 'mark', lines: [2, 3, 4, 5] }],
			},
		})

		await expectMetaResult('twoslash del={1,2,3}', {
			meta: 'twoslash',
			annotations: {
				lineMarkings: [{ markerType: 'del', lines: [1, 2, 3] }],
			},
		})
	})

	describe('Plaintext inline markings in single or double quotes', () => {
		test('Simple text', async () => {
			await expectMetaResult('some "double-quoted text"', {
				meta: 'some',
				annotations: {
					plaintextTerms: [{ markerType: 'mark', text: 'double-quoted text' }],
				},
			})

			await expectMetaResult("and 'single-quoted text' too", {
				meta: 'and too',
				annotations: {
					plaintextTerms: [{ markerType: 'mark', text: 'single-quoted text' }],
				},
			})
		})

		test('Containing quotes of different type', async () => {
			await expectMetaResult('"double-quoted \'with nested single\'"', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'mark', text: "double-quoted 'with nested single'" }],
				},
			})

			await expectMetaResult('\'single-quoted "with nested double"\'', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'mark', text: 'single-quoted "with nested double"' }],
				},
			})
		})

		test('Containing escaped quotes of same type', async () => {
			await expectMetaResult('"double-quoted \\"with escaped inner double\\""', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'mark', text: 'double-quoted "with escaped inner double"' }],
				},
			})

			await expectMetaResult("'single-quoted \\'with escaped inner single\\''", {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'mark', text: "single-quoted 'with escaped inner single'" }],
				},
			})
		})

		test('With optional marker type prefixes', async () => {
			await expectMetaResult('mark="prefixed with mark"', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'mark', text: 'prefixed with mark' }],
				},
			})

			await expectMetaResult('ins="prefixed with ins"', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'ins', text: 'prefixed with ins' }],
					lineMarkings: [],
				},
			})

			await expectMetaResult('del="prefixed with del"', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'del', text: 'prefixed with del' }],
					lineMarkings: [],
				},
			})
		})

		test('With marker type prefix aliases', async () => {
			await expectMetaResult('add="prefixed with add"', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'ins', text: 'prefixed with add' }],
					lineMarkings: [],
				},
			})

			await expectMetaResult('rem="prefixed with rem"', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'del', text: 'prefixed with rem' }],
					lineMarkings: [],
				},
			})
		})

		test('With equal signs and nested quotes of different type inside a quoted string', async () => {
			await expectMetaResult(`ins='= "Hello"'`, {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'ins', text: '= "Hello"' }],
				},
			})
		})

		test('With equal signs and escaped quotes of same type inside a quoted string', async () => {
			await expectMetaResult('ins="= \\"Astronaut\\""', {
				meta: '',
				annotations: {
					plaintextTerms: [{ markerType: 'ins', text: '= "Astronaut"' }],
				},
			})
		})

		test('With everything combined', async () => {
			await expectMetaResult(`title="src/components/GreetingHeadline.astro" ins='= "Hello"' ins="= \\"Astronaut\\""`, {
				meta: 'title="src/components/GreetingHeadline.astro"',
				annotations: {
					plaintextTerms: [
						{ markerType: 'ins', text: '= "Hello"' },
						{ markerType: 'ins', text: '= "Astronaut"' },
					],
				},
			})
		})
	})

	describe('RegExp inline markings in forward slashes', () => {
		test('Simple RegExp', async () => {
			await expectMetaResult('/he(llo|y)/', {
				meta: '',
				annotations: {
					regExpTerms: [{ markerType: 'mark', regExp: createMarkerRegExp('he(llo|y)') }],
				},
			})
		})

		test('Containing quotes', async () => {
			await expectMetaResult('/they said ["\']oh, hi!["\']/', {
				meta: '',
				annotations: {
					regExpTerms: [{ markerType: 'mark', regExp: createMarkerRegExp('they said ["\']oh, hi!["\']') }],
				},
			})
		})

		test('Containing escaped slashes', async () => {
			await expectMetaResult('/use \\/slashes\\/ like this/', {
				meta: '',
				annotations: {
					regExpTerms: [{ markerType: 'mark', regExp: createMarkerRegExp('use \\/slashes\\/ like this') }],
					lineMarkings: [],
				},
			})
		})

		test('With optional marker type prefixes', async () => {
			await expectMetaResult('mark=/prefixed with mark/', {
				meta: '',
				annotations: {
					regExpTerms: [{ markerType: 'mark', regExp: createMarkerRegExp('prefixed with mark') }],
					lineMarkings: [],
				},
			})

			await expectMetaResult('ins=/prefixed with ins/', {
				meta: '',
				annotations: {
					regExpTerms: [{ markerType: 'ins', regExp: createMarkerRegExp('prefixed with ins') }],
					lineMarkings: [],
				},
			})

			await expectMetaResult('del=/prefixed with del/', {
				meta: '',
				annotations: {
					regExpTerms: [{ markerType: 'del', regExp: createMarkerRegExp('prefixed with del') }],
					lineMarkings: [],
				},
			})
		})
	})
})

test('Everything combined', async () => {
	await expectMetaResult(
		[
			// Non-processed meta string
			'twoslash',
			// Title attribute
			'title="src/components/DynamicAttributes.astro"',
			// Regular strings
			'"{name}"',
			'"${name}"',
			// Inline-level RegExp marking
			'/(?:[(]|=== )(tag)/',
			// Line-level deletion marking
			'del={4-5}',
			// Inline-level insertion marking
			'ins=":where(.astro-XXXXXX)"',
		].join(' '),
		{
			meta: 'twoslash title="src/components/DynamicAttributes.astro"',
			annotations: {
				lineMarkings: [{ markerType: 'del', lines: [4, 5] }],
				plaintextTerms: [
					{ markerType: 'mark', text: '{name}' },
					{ markerType: 'mark', text: '${name}' },
					{ markerType: 'ins', text: ':where(.astro-XXXXXX)' },
				],
				regExpTerms: [{ markerType: 'mark', regExp: createMarkerRegExp('(?:[(]|=== )(tag)') }],
			},
		}
	)
})
