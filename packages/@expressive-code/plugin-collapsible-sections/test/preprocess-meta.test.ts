import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginCollapsibleSections, pluginCollapsibleSectionsData } from '../src'
import { Section } from '../src/utils'

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

type ExpectedMetaResult = {
	sections: Omit<Section, 'lines'>[]
}

/** Tests that a given input meta-string gets transformed into the expected meta-string and a corresponding sections data on the codeblock */
const expectMetaResult = async (input: string, expected: Partial<ExpectedMetaResult>) => {
	const { sections } = expected
	const expectedResult: ExpectedMetaResult = {
		sections: sections || [],
	}

	// Create an Expressive Code instance with our plugin
	// and use it to render the test code
	const engine = new ExpressiveCodeEngine({
		plugins: [pluginCollapsibleSections()],
	})
	const data = {
		code: astroCodeSnippet,
		language: 'astro',
		meta: input,
	}
	const { renderedGroupContents } = await engine.render(data)
	expect(renderedGroupContents).toHaveLength(1)
	const codeBlock = renderedGroupContents[0].codeBlock

	const actual: ExpectedMetaResult = {
		sections: pluginCollapsibleSectionsData.getOrCreateFor(codeBlock)?.sections,
	}

	expect(actual).toMatchObject(expectedResult)
}

describe('Ignores unknown options', () => {
	test('Simple text', async () => {
		await expectMetaResult('twoslash', {})
		await expectMetaResult('2-4', {})
	})

	test('Unknown properties in single or double quotes', async () => {
		await expectMetaResult('"2-4"', {})
		await expectMetaResult('yabba="2-4"', {})
		await expectMetaResult("'2-4'", {})
		await expectMetaResult("multipass='2-4'", {})
	})

	test('Unknown properties in curly braces', async () => {
		await expectMetaResult('{2-4}', {})
		await expectMetaResult('whoops={2-4}', {})
		await expectMetaResult('nothingToSee={2-4}', {})
	})
})

test('Ignores invalid ranges', async () => {
	await expectMetaResult('collapse={5-2}', {})
	await expectMetaResult('collapse={2-}', {})
	await expectMetaResult('collapse={-5}', {})
	await expectMetaResult('collapse={none}', {})
	await expectMetaResult('hello collapse={world} world', {})
	await expectMetaResult('collapse={}', {})
})

test('Handles the option `collapse` with valid ranges', async () => {
	await expectMetaResult('collapse={2-5}', {
		sections: [{ from: 2, to: 5 }],
	})

	await expectMetaResult('collapse={2-5,6-10}', {
		sections: [
			{ from: 2, to: 5 },
			{ from: 6, to: 10 },
		],
	})

	await expectMetaResult('collapse={ 2-5, 6-10 }', {
		sections: [
			{ from: 2, to: 5 },
			{ from: 6, to: 10 },
		],
	})

	await expectMetaResult('hello collapse={2-5} world', {
		sections: [{ from: 2, to: 5 }],
	})
})

test('Supports specifying the `collapse` option multiple times', async () => {
	await expectMetaResult('collapse={2-5} collapse={6-10}', {
		sections: [
			{ from: 2, to: 5 },
			{ from: 6, to: 10 },
		],
	})
})

test('Merges overlapping sections', async () => {
	await expectMetaResult('collapse={2-5,3-6}', {
		sections: [{ from: 2, to: 5 }],
	})

	await expectMetaResult('collapse={2-5,5-6}', {
		sections: [{ from: 2, to: 5 }],
	})

	await expectMetaResult('collapse={2-5,1-2}', {
		sections: [{ from: 2, to: 5 }],
	})
})
