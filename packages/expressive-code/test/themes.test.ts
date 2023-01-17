import chroma from 'chroma-js'
import { IElement } from 'happy-dom'
import { Highlighter } from 'shiki'
import { describe, test, expect } from 'vitest'
import { ColorMapping, ExpressiveCodeDefaultColors, getThemeColor } from '../src/common/annotations'
import { createHighlighter, annotationResultToHtml, getAnnotationResult, ElementColors } from './utils'

const jsxCodeSnippet = `
interface PropsType {
  children: JSX.Element
  name: string
}

class Component extends React.Component<PropsType, {}> {
  render() {
    // Wrap some custom HTML around the given children
    return (
      <article title={\`Found \${this.props.children.length} children\`}>
        <div>{this.props.children}</div>
      </article>
    )
  }
}

<Component name="foo">
  {/* This is a JSX comment */}
  <h1>Hello World</h1>
</Component>
`

const annotateChildrenAndArticleLines = ({ testName, highlighter, customColors }: { testName: string; highlighter: Highlighter; customColors?: ColorMapping }) => {
	const annotationResult = getAnnotationResult(jsxCodeSnippet, {
		lang: 'tsx',
		highlighter,
		annotations: {
			lineMarkings: [{ lines: [2] }, { markerType: 'ins', lines: [10] }],
			inlineMarkings: [{ text: 'Found' }],
		},
		customColors,
	})

	let markedInterfaceColors: ElementColors
	let regularInterfaceColors: ElementColors
	let insertedArticleColors: ElementColors
	let regularArticleColors: ElementColors

	annotationResultToHtml({
		testName,
		annotationResult,
		runDomTests: ({ domWindow, getCssVar, getElementColors }) => {
			const findChildWithContent = (parent: IElement, selector: string, content: string) => {
				const childrenMatchingSelector = parent.querySelectorAll(selector)
				const childrenAlsoMatchingContent = childrenMatchingSelector.filter((child) => child.innerHTML.indexOf(content) > -1)
				expect(childrenAlsoMatchingContent.length, `Did not find exactly one matching child with content "${content}"`).toEqual(1)
				return childrenAlsoMatchingContent[0]
			}

			// Get colors of the first marked token (interface property "children")
			const markedInterfaceLine = domWindow.document.querySelector('#annotated pre.expressive-code .mark')
			const markedInterfaceToken = findChildWithContent(markedInterfaceLine, 'span', 'children')
			markedInterfaceColors = getElementColors(markedInterfaceToken, { background: getCssVar('--ec-mark-bg') })

			// Get colors of the matching regular token (interface property "name")
			const regularInterfaceLine = markedInterfaceLine.nextElementSibling
			const regularInterfaceToken = findChildWithContent(regularInterfaceLine, 'span', 'name')
			regularInterfaceColors = getElementColors(regularInterfaceToken)

			// Get colors of the first inserted token (opening tag of "article" element)
			const insertedArticleLine = domWindow.document.querySelector('#annotated pre.expressive-code .ins')
			const insertedArticleToken = findChildWithContent(insertedArticleLine, 'span', 'article')
			insertedArticleColors = getElementColors(insertedArticleToken, { background: getCssVar('--ec-ins-bg') })

			// Get colors of the matching regular token (closing tag of "article" element)
			const regularArticleLine = insertedArticleLine.nextElementSibling.nextElementSibling
			const regularArticleToken = findChildWithContent(regularArticleLine, 'span', 'article')
			regularArticleColors = getElementColors(regularArticleToken)
		},
	})

	return {
		annotationResult,
		markedInterfaceColors: markedInterfaceColors!,
		regularInterfaceColors: regularInterfaceColors!,
		insertedArticleColors: insertedArticleColors!,
		regularArticleColors: regularArticleColors!,
	}
}

describe('Annotation colors', () => {
	test('Allows retrieving theme colors by key', () => {
		expect(Math.abs(226 - chroma(getThemeColor('mark.background')).hsl()[0])).toBeLessThan(20)
		expect(getThemeColor('mark.background')).toEqual(ExpressiveCodeDefaultColors['mark.background'])
	})

	test('Allows overriding retrieved theme colors using customColors', () => {
		expect(Math.abs(120 - chroma(getThemeColor('mark.background', { 'mark.background': 'hsl(120, 50%, 50%)' })).hsl()[0])).toBeLessThan(20)
	})

	test('Annotates using default theme colors if no customColors were given', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'material-default',
		})

		const { markedInterfaceColors, insertedArticleColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
		})

		// Expect the mark background color to match the default mark background color
		expect(markedInterfaceColors.background.hsl()).toEqual(chroma(getThemeColor('mark.background')).hsl())

		// Expect the ins background color to match the default ins background color
		expect(insertedArticleColors.background.hsl()).toEqual(chroma(getThemeColor('ins.background')).hsl())
	})

	test('Annotates using partially given customColors', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'material-default',
		})

		const customMarkBg = 'hsl(150, 50%, 50%)'

		const { markedInterfaceColors, insertedArticleColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
			customColors: {
				'mark.background': customMarkBg,
			},
		})

		// Expect the mark background color to match the overwritten mark background color
		expect(markedInterfaceColors.background.hsl()).toEqual(chroma(customMarkBg).hsl())

		// Expect the ins background color to match the default ins background color
		// (as it was not overwritten)
		expect(insertedArticleColors.background.hsl()).toEqual(chroma(getThemeColor('ins.background')).hsl())
	})
})

describe('Color contrast in marked lines', () => {
	test('If text is lighter than annotation bg and contrast is low, lightens text', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'material-default',
		})

		const { regularArticleColors, insertedArticleColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
		})

		// Expect the regular text color to be lighter than the annotation's background color
		// (as this is the scenario we're testing here)
		expect(regularArticleColors.text.luminance()).toBeGreaterThan(insertedArticleColors.background.luminance())

		// Expect the annotated text color to be lighter than the regular text color
		expect(insertedArticleColors.text.luminance()).toBeGreaterThan(regularArticleColors.text.luminance())
	})

	test('If text is lighter than annotation bg and contrast is ok, keeps text color', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'github-dark',
		})

		const { regularArticleColors, insertedArticleColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
		})

		// Expect the regular text color to be lighter than the annotation's background color
		// (as this is the scenario we're testing here)
		expect(regularArticleColors.text.luminance()).toBeGreaterThan(insertedArticleColors.background.luminance())

		// Expect the annotated text color to equal the regular text color
		expect(insertedArticleColors.text.hex()).toEqual(regularArticleColors.text.hex())
	})

	test('If text is lighter than annotation bg, contrast is low and lightening fails, darkens text', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'monokai',
		})

		const { regularInterfaceColors, markedInterfaceColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
			customColors: {
				'mark.background': 'hsl(226, 50%, 80%)',
			},
		})

		// Expect the regular text color to be lighter than the annotation's background color,
		// which ensures that the first attempt of fixing a lack of color contrast
		// would be to make the text even lighter
		expect(regularInterfaceColors.text.luminance()).toBeGreaterThan(markedInterfaceColors.background.luminance())

		// Expect the annotated text to not be lighter, but darker than the regular text color,
		// which means that the first attempt described above did not work,
		// so we had to invert the direction of the color change
		expect(markedInterfaceColors.text.luminance()).toBeLessThan(regularInterfaceColors.text.luminance())
	})

	test('If text is darker than annotation bg and contrast is low, darkens text', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'light-plus',
		})

		const { regularInterfaceColors, markedInterfaceColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
			customColors: {
				'mark.background': 'hsl(226, 50%, 60%)',
			},
		})

		// Expect the regular text color to be darker than the annotation's background color
		// (as this is the scenario we're testing here)
		expect(regularInterfaceColors.text.luminance()).toBeLessThan(markedInterfaceColors.background.luminance())

		// Expect the annotated text color to be darker than the regular text color
		expect(markedInterfaceColors.text.luminance()).toBeLessThan(regularInterfaceColors.text.luminance())
	})

	test('If text is darker than annotation bg and contrast is ok, keeps text color', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'min-light',
		})

		const { regularInterfaceColors, markedInterfaceColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
			customColors: {
				'mark.background': 'hsl(226, 50%, 80%)',
			},
		})

		// Expect the regular text color to be darker than the annotation's background color
		// (as this is the scenario we're testing here)
		expect(regularInterfaceColors.text.luminance()).toBeLessThan(markedInterfaceColors.background.luminance())

		// Expect the annotated text color to equal the regular text color
		expect(markedInterfaceColors.text.hex()).toEqual(regularInterfaceColors.text.hex())
	})

	test('If text is darker than annotation bg, contrast is low and darkening fails, lightens text', async (ctx) => {
		const highlighter = await createHighlighter({
			theme: 'min-light',
		})

		const { regularInterfaceColors, markedInterfaceColors } = annotateChildrenAndArticleLines({
			testName: ctx.meta.name,
			highlighter,
		})

		// Expect the regular text color to be darker than the annotation's background color,
		// which ensures that the first attempt of fixing a lack of color contrast
		// would be to make the text even darker
		expect(regularInterfaceColors.text.luminance()).toBeLessThan(markedInterfaceColors.background.luminance())

		// Expect the annotated text to not be darker, but lighter than the regular text color,
		// which means that the first attempt described above did not work,
		// so we had to invert the direction of the color change
		expect(markedInterfaceColors.text.luminance()).toBeGreaterThan(regularInterfaceColors.text.luminance())
	})
})
