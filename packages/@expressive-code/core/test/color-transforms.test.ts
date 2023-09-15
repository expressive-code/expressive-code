import { describe, expect, test } from 'vitest'
import { ColorInput, TinyColor } from '@ctrl/tinycolor'
import {
	changeAlphaToReachColorContrast,
	changeLuminanceToReachColorContrast,
	chromaticRecolor,
	ensureColorContrastOnBackground,
	getColorContrastOnBackground,
	getLuminance,
	multiplyAlpha,
	onBackground,
	setLuminance,
	toHexColor,
} from '../src/helpers/color-transforms'
import { tailwindColors } from './colors/tailwind'
import { rgbaToLab, rgbaToLchab, rgbaToOklch } from '../src/internal/color-spaces'

describe('Color Space Support', () => {
	function expectAllToBeClose<TActual extends object>(actual: { [K in keyof TActual]: unknown }, expected: Record<string, number | undefined>, numDigits = 1) {
		for (const [key, value] of Object.entries(expected)) {
			expect(actual[key as keyof TActual], `Component "${key}"`).toBeCloseTo(value ?? NaN, numDigits)
		}
	}

	describe('LAB', () => {
		test('Can convert LAB colors to RGB', () => {
			expect(toHexColor(`lab(0 0 0)`)).toEqual('#000000')
			expect(toHexColor(`lab(50 0 0)`)).toEqual('#777777')
			expect(toHexColor(`lab(50% 0 0)`)).toEqual('#777777')
			expect(toHexColor(`lab(100 0 0)`)).toEqual('#ffffff')
			expect(toHexColor(`lab(20.83 6.64 -33.68)`)).toEqual('#003264')
			expect(toHexColor(`lab(54.72 18.79 -70.92)`)).toEqual('#0080ff')
		})
		test('Can convert RGB colors to LAB', () => {
			expectAllToBeClose(rgbaToLab({ r: 0, g: 0, b: 0 }), { l: 0, a: 0, b: 0 })
			expectAllToBeClose(rgbaToLab({ r: 119, g: 119, b: 119 }), { l: 50, a: 0, b: 0 })
			expectAllToBeClose(rgbaToLab({ r: 255, g: 255, b: 255 }), { l: 100, a: 0, b: 0 })
			expectAllToBeClose(rgbaToLab({ r: 0, g: 50, b: 100 }), { l: 20.83, a: 6.64, b: -33.68 })
			expectAllToBeClose(rgbaToLab({ r: 0, g: 128, b: 255 }), { l: 54.72, a: 18.79, b: -70.92 })
		})
	})

	describe('LCH(ab)', () => {
		test('Can convert LCH(ab) colors to RGB', () => {
			expect(toHexColor(`lch(0 0 0)`)).toEqual('#000000')
			expect(toHexColor(`lch(50 0 0)`)).toEqual('#777777')
			expect(toHexColor(`lch(100 0 0)`)).toEqual('#ffffff')
			expect(toHexColor(`lch(20.83195 34.32489 281.15674)`)).toEqual('#003264')
			expect(toHexColor(`lch(54.72 73.36 284.84)`)).toEqual('#0080ff')
			expect(toHexColor(`lch(54.72% 73.36 284.84)`)).toEqual('#0080ff')
		})
		test('Can convert RGB colors to LCH(ab)', () => {
			expectAllToBeClose(rgbaToLchab({ r: 0, g: 0, b: 0 }), { l: 0, c: 0 })
			expectAllToBeClose(rgbaToLchab({ r: 119, g: 119, b: 119 }), { l: 50, c: 0 })
			expectAllToBeClose(rgbaToLchab({ r: 255, g: 255, b: 255 }), { l: 100, c: 0 })
			expectAllToBeClose(rgbaToLchab({ r: 0, g: 50, b: 100 }), { l: 20.83195, c: 34.32489, h: 281.15674 })
			expectAllToBeClose(rgbaToLchab({ r: 0, g: 128, b: 255 }), { l: 54.72, c: 73.36, h: 284.84 })
		})
	})

	describe('OKLCH', () => {
		test('Can convert OKLCH colors to RGB', () => {
			expect(toHexColor(`oklch(0 0 0)`)).toEqual('#000000')
			expect(toHexColor(`oklch(0.5693 0 0)`)).toEqual('#777777')
			expect(toHexColor(`oklch(56.93% 0 0)`)).toEqual('#777777')
			expect(toHexColor(`oklch(1 0 0)`)).toEqual('#ffffff')
			expect(toHexColor(`oklch(31.9% 0.101 253.8)`)).toEqual('#003264')
			expect(toHexColor(`oklch(0.6152 0.211 256.1)`)).toEqual('#0080ff')
		})
		test('Can convert RGB colors to OKLCH', () => {
			expectAllToBeClose(rgbaToOklch({ r: 0, g: 0, b: 0 }), { l: 0, c: 0 })
			expectAllToBeClose(rgbaToOklch({ r: 119, g: 119, b: 119 }), { l: 0.56, c: 0 })
			expectAllToBeClose(rgbaToOklch({ r: 255, g: 255, b: 255 }), { l: 1, c: 0 })
			expectAllToBeClose(rgbaToOklch({ r: 0, g: 50, b: 100 }), { l: 0.319, c: 0.101, h: 253.8 })
			expectAllToBeClose(rgbaToOklch({ r: 0, g: 128, b: 255 }), { l: 0.6152, c: 0.211, h: 256.1 })
		})
	})
})

describe('Color Transforms', () => {
	describe('multiplyAlpha()', () => {
		test('Multiplies the alpha value of a color with the given factor', () => {
			expect(multiplyAlpha('#0f0', 0.5)).toBe('#00ff0080')
			expect(multiplyAlpha('#00ff0080', 0.5)).toBe('#00ff0040')
		})
		test('Automatically limits the resulting alpha value to the range 0 to 1', () => {
			expect(multiplyAlpha('#0f0', 2)).toBe('#00ff00')
			expect(multiplyAlpha('#0f0', -2)).toBe('#00ff0000')
		})
		test(`Returns the input if it's not a valid color`, () => {
			// @ts-expect-error Passing undefined as input
			expect(multiplyAlpha(undefined, 0.5)).toEqual(undefined)
			expect(multiplyAlpha('none', 0.5)).toEqual('none')
		})
	})

	describe('setLuminance()', () => {
		test('Can increase the luminance', () => {
			runTestCases([
				{ color: '#000', oldLuminance: 0, targetLuminance: 0.5, expected: '#bcbcbc' },
				{ color: '#555', oldLuminance: 0.09, targetLuminance: 0.5, expected: '#bcbcbc' },
				{ color: '#0f0', oldLuminance: 0.72, targetLuminance: 0.8, expected: '#97ff97' },
				{ color: '#0f0', oldLuminance: 0.72, targetLuminance: 0.9, expected: '#d3ffd3' },
				{ color: '#f0f', oldLuminance: 0.28, targetLuminance: 0.4, expected: '#ff70ff' },
				{ color: '#f0f', oldLuminance: 0.28, targetLuminance: 0.5, expected: '#ff96ff' },
				{ color: '#f0f', oldLuminance: 0.28, targetLuminance: 0.8, expected: '#ffddff' },
			])
		})

		test('Can decrease the luminance', () => {
			runTestCases([
				{ color: '#ddd', oldLuminance: 0.72, targetLuminance: 0.5, expected: '#bbbbbb' },
				{ color: '#fff', oldLuminance: 1, targetLuminance: 0.5, expected: '#bbbbbb' },
				{ color: '#0f0', oldLuminance: 0.72, targetLuminance: 0.6, expected: '#00ec00' },
				{ color: '#0f0', oldLuminance: 0.72, targetLuminance: 0.4, expected: '#00c500' },
				{ color: '#0f0', oldLuminance: 0.72, targetLuminance: 0.1, expected: '#006800' },
			])
		})

		function runTestCases(testCases: { color: string; oldLuminance: number; targetLuminance: number; expected: string }[]) {
			testCases.forEach((testCase) => {
				const { color, oldLuminance, targetLuminance, expected } = testCase
				expect(getLuminance(color), `Failed case (oldLuminance): ${JSON.stringify(testCase)}`).toBeCloseTo(oldLuminance, 2)
				const newColor = setLuminance(color, targetLuminance)
				const newLuminance = getLuminance(newColor)
				expect(newLuminance, `Failed case (targetLuminance): ${JSON.stringify({ ...testCase, newColor, newLuminance })}`).toBeCloseTo(targetLuminance, 2)
				expect(newColor, `Failed case (newColor): ${JSON.stringify({ ...testCase, newColor, newLuminance })}`).toBe(expected)
			})
		}
	})

	describe('onBackground()', () => {
		test('Uses the alpha channel of the input color', () => {
			expect(onBackground('#ffffff', '#000000')).toBe('#ffffff')
			expect(onBackground('#ffffff80', '#000000')).toBe('#808080')
			expect(onBackground('#ffffff00', '#000000')).toBe('#000000')
			expect(onBackground('transparent', '#000000')).toBe('#000000')
		})
		test('Returns the background if the input color cannot be parsed', () => {
			expect(onBackground(null as unknown as string, '#00f000')).toBe('#00f000')
			expect(onBackground(undefined as unknown as string, '#00f000')).toBe('#00f000')
			expect(onBackground('', '#00f000')).toBe('#00f000')
			expect(onBackground('var(--unknown)', '#00f000')).toBe('#00f000')
		})
	})

	describe('changeAlphaToReachColorContrast()', () => {
		test('Can increase the alpha value', () => {
			const color = '#6a737d45'
			const bg = '#24292e'
			const contrast = getColorContrastOnBackground(color, bg)
			expect(contrast).toBeCloseTo(1.3, 1)
			const newColor = changeAlphaToReachColorContrast(color, bg, 2.5, 3.5)
			const newContrast = getColorContrastOnBackground(newColor, bg)
			expect(newContrast).toBeCloseTo(2.5, 1)
		})
		test('Can decrease the alpha value', () => {
			const color = '#6a737d'
			const bg = '#24292e'
			const contrast = getColorContrastOnBackground(color, bg)
			expect(contrast).toBeCloseTo(3, 1)
			const newColor = changeAlphaToReachColorContrast(color, bg, 1.5, 2.5)
			const newContrast = getColorContrastOnBackground(newColor, bg)
			expect(newContrast).toBeCloseTo(2.5, 1)
		})
	})

	describe('ensureColorContrastOnBackground()', () => {
		test('If color is lighter than bg and contrast is low, lightens color', () => {
			expect(ensureColorContrastOnBackground('#111111', '#000000')).toBe('#838383')
		})
		test('If color is lighter than bg and contrast is ok, returns unchanged color', () => {
			expect(ensureColorContrastOnBackground('#ffffff', '#000000')).toBe('#ffffff')
		})
		test('If color is lighter than bg, contrast is low and lightening fails, darkens color', () => {
			const color = '#bbe6b3'
			const bg = '#b3bee6'
			const result = changeLuminanceToReachColorContrast(color, bg, 5.5)
			expect(result).toBe('#384435')

			const oldContrast = getColorContrastOnBackground(color, bg)
			expect(oldContrast).toBeLessThanOrEqual(1.33)
			const newContrast = getColorContrastOnBackground(result, bg)
			expect(newContrast).toBeCloseTo(5.5, 0.5)
		})
		test('If color is darker than bg and contrast is low, darkens color', () => {
			expect(ensureColorContrastOnBackground('#faffa0', '#ffffff')).toBe('#686b43')
		})
		test('If color is darker than bg and contrast is ok, returns unchanged color', () => {
			expect(ensureColorContrastOnBackground('#000000', '#ffffff')).toBe('#000000')
		})
		test('If color is darker than bg, contrast is low and darkening fails, lightens color', () => {
			const color = '#004700'
			const bg = '#364B6C'
			const result = changeLuminanceToReachColorContrast(color, bg, 5.5)
			expect(result).toBe('#bfd1bf')

			const oldContrast = getColorContrastOnBackground(color, bg)
			expect(oldContrast).toBeLessThanOrEqual(1.33)
			const newContrast = getColorContrastOnBackground(result, bg)
			expect(newContrast).toBeCloseTo(5.5, 0.5)
		})
		test('Returns unchanged input if color cannot be determined', () => {
			// @ts-expect-error Passing undefined as input
			expect(ensureColorContrastOnBackground(undefined, '#fff')).toEqual(undefined)
			expect(ensureColorContrastOnBackground('none', '#fff')).toEqual('none')
			expect(ensureColorContrastOnBackground('var(--test)', '#fff')).toEqual('var(--test)')
		})
		test('Returns hex color if bg cannot be determined', () => {
			// @ts-expect-error Passing undefined as input
			expect(ensureColorContrastOnBackground('#a0a', undefined)).toEqual('#aa00aa')
			expect(ensureColorContrastOnBackground('#a0a', 'none')).toEqual('#aa00aa')
			expect(ensureColorContrastOnBackground('#a0a', 'var(--test)')).toEqual('#aa00aa')
		})
	})

	describe('chromaticRecolor()', () => {
		const tailwindInputs = Object.entries(tailwindColors).map(([paletteName, colors]) => {
			return {
				paletteName,
				colors,
			}
		})
		const targetHues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
		const testTemplates = tailwindInputs.map((tailwindInput) => {
			const testCase: [string, Omit<PaletteTestCase, 'target'>] = [
				`Tailwind ${tailwindInput.paletteName}`,
				{
					...tailwindInput,
				},
			]
			return testCase
		})

		describe('Keeps OKLCH lightness delta <= 0.4% when recoloring Tailwind colors', () => {
			test.each(testTemplates)('%s', (_, testCase) => {
				if (typeof testCase === 'string') return
				const hueTestCases = targetHues.map((hue) => {
					return {
						...testCase,
						target: { hue, chroma: 0.27 },
						expectedMaxLightnessDelta: 0.004,
					}
				})

				runPaletteTests(hueTestCases)
			})
		})

		describe('Keeps luminance delta <= 9% when recoloring Tailwind colors', () => {
			test.each(testTemplates)('%s', (_, testCase) => {
				if (typeof testCase === 'string') return
				const hueTestCases = targetHues.map((hue) => {
					return {
						...testCase,
						target: { hue, chroma: 0.27 },
						expectedMaxLuminanceDelta: 0.09,
					}
				})

				runPaletteTests(hueTestCases)
			})
		})

		test('Can recolor gray colors', () => {
			runPaletteTests([
				{
					paletteName: 'Tailwind neutral to #60a5fa',
					colors: tailwindColors.neutral,
					target: '#60a5fa',
					expectedMaxLightnessDelta: 0.004,
					//blue:         ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'],
					expectedColors: ['#fafafb', '#f2f5fa', '#d5e7fe', '#b9d7fd', '#61a6fa', '#1472d3', '#0c519a', '#073f7a', '#03264d', '#011733', '#000a1c'],
					//neutral:      ['#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626', '#171717', '#0a0a0a'],
				},
			])
			runPaletteTests([
				{
					paletteName: 'Tailwind slate to hue & chroma of rose',
					colors: tailwindColors.slate,
					target: { hue: 17.58, chroma: 0.22 },
					expectedMaxLightnessDelta: 0.004,
					//rose:         ['#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#4c0519'],
					expectedColors: ['#faf9f9', '#faf2f2', '#ffdedf', '#ffc2c3', '#ff6876', '#d50640', '#9f002d', '#7c0021', '#530013', '#350009', '#170002'],
					//slate:        ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617'],
				},
			])
			runPaletteTests([
				{
					paletteName: 'Tailwind slate to #e11d48',
					colors: tailwindColors.slate,
					target: '#e11d48',
					expectedMaxLightnessDelta: 0.004,
					//rose:         ['#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#4c0519'],
					expectedColors: ['#faf9f9', '#faf2f2', '#fedfdf', '#fdc3c4', '#fb6d79', '#d11a42', '#9c112f', '#790a23', '#510414', '#33020a', '#160002'],
					//slate:        ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617'],
				},
			])
		})

		test('Can recolor non-gray colors', () => {
			runPaletteTests([
				{
					paletteName: 'Tailwind blue to #3b82f6',
					colors: tailwindColors.blue,
					target: '#3b82f6',
					expectedMaxLightnessDelta: 0.002,
					//blue:         ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'],
					expectedColors: ['#f3f5fa', '#dde9fd', '#c4dafc', '#9fc2fa', '#6ea2f8', '#3b82f6', '#1667e4', '#1158c4', '#0c48a3', '#093c8b', '#04255c'],
				},
			])
			runPaletteTests([
				{
					paletteName: 'Tailwind rose to same hue & chroma',
					colors: tailwindColors.rose,
					target: { hue: 17.58, chroma: 0.22 },
					expectedMaxLightnessDelta: 0.002,
					//rose:         ['#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#4c0519'],
					expectedColors: ['#faf3f3', '#ffe4e4', '#ffcdce', '#ffa4a7', '#ff6e7b', '#f63c5a', '#e02049', '#c10038', '#a3002e', '#8e0027', '#4f0011'],
				},
			])
			runPaletteTests([
				{
					paletteName: 'Tailwind blue to hue & chroma of rose',
					colors: tailwindColors.blue,
					target: { hue: 17.58, chroma: 0.22 },
					expectedMaxLightnessDelta: 0.004,
					//rose:         ['#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#4c0519'],
					expectedColors: ['#faf3f3', '#ffe0e0', '#ffc8c9', '#ffa4a7', '#ff6b78', '#ee3253', '#d1003e', '#b40034', '#950029', '#7f0022', '#540013'],
					//blue:         ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'],
				},
			])
		})

		type PaletteTestCase = {
			paletteName: string
			colors: string[]
			target: Parameters<typeof chromaticRecolor>[1]
			expectedMaxLightnessDelta?: number | undefined
			expectedMaxLuminanceDelta?: number | undefined
			expectedColors?: string[] | undefined
		}

		function runPaletteTests(testCases: PaletteTestCase[]) {
			testCases.forEach((testCase) => {
				const { paletteName, colors: inputColors, target, expectedMaxLightnessDelta, expectedMaxLuminanceDelta, expectedColors } = testCase
				const outputColors = inputColors.map((color) => chromaticRecolor(color, target))

				if (expectedMaxLightnessDelta !== undefined) {
					validateTransformedColors({
						label: `${paletteName}: OKLCH lightness within ${expectedMaxLightnessDelta}`,
						inputColors,
						outputColors,
						validationFn: (inputColor, outputColor) => {
							const a = getOklchLightness(inputColor)
							const b = getOklchLightness(outputColor)
							return Math.abs(a - b) <= expectedMaxLightnessDelta
						},
					})
				}

				if (expectedMaxLuminanceDelta !== undefined) {
					validateTransformedColors({
						label: `${paletteName}: luminance within ${expectedMaxLuminanceDelta}`,
						inputColors,
						outputColors,
						validationFn: (inputColor, outputColor) => {
							const a = getLuminance(inputColor)
							const b = getLuminance(outputColor)
							return Math.abs(a - b) <= expectedMaxLuminanceDelta
						},
					})
				}

				if (expectedColors !== undefined) {
					expect(outputColors, `Failed case (${paletteName}: hex equality): ${JSON.stringify({ ...testCase, outputColors })}`).toEqual(expectedColors)
				}
			})
		}
	})
})

function validateTransformedColors({
	label,
	inputColors,
	outputColors,
	validationFn,
}: {
	label: string
	inputColors: string[]
	outputColors: string[]
	validationFn: (inputColor: string, outputColor: string) => boolean
}) {
	const validationResults = inputColors.map((inputColor, index) => validationFn(inputColor, outputColors[index]))
	expect(
		validationResults.every((result) => result),
		`Failed case (${label}): ${JSON.stringify({ inputColors, outputColors, validationResults })}`
	).toEqual(true)
}

function getOklchLightness(input: ColorInput) {
	return rgbaToOklch(new TinyColor(input)).l
}
