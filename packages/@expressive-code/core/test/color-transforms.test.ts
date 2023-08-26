import { describe, expect, test } from 'vitest'
import {
	changeAlphaToReachColorContrast,
	changeLuminanceToReachColorContrast,
	ensureColorContrastOnBackground,
	getColorContrastOnBackground,
	multiplyAlpha,
	setLuminance,
	toHexColor,
} from '../src/helpers/color-transforms'
import { ColorInput, TinyColor } from '@ctrl/tinycolor'
import { rgbaToLab, rgbaToLchab } from '../src/internal/color-spaces'

describe('Color Space Support', () => {
	const expectAllToBeClose = (actual: { [key: string]: number | undefined }, expected: { [key: string]: number | undefined }, numDigits = 1) => {
		for (const [key, value] of Object.entries(expected)) {
			expect(actual[key], `Component "${key}"`).toBeCloseTo(value ?? NaN, numDigits)
		}
	}

	describe('LAB', () => {
		test('Can convert LAB colors to RGB', () => {
			expect(toHexColor({ l: 0, a: 0, b: 0 })).toEqual('#000000')
			expect(toHexColor({ l: 50, a: 0, b: 0 })).toEqual('#777777')
			expect(toHexColor({ l: 100, a: 0, b: 0 })).toEqual('#ffffff')
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
			expect(toHexColor({ l: 0, c: 0, h: 0 })).toEqual('#000000')
			expect(toHexColor({ l: 50, c: 0, h: 0 })).toEqual('#777777')
			expect(toHexColor({ l: 100, c: 0, h: 0 })).toEqual('#ffffff')
			expect(toHexColor({ l: 20.83195, c: 34.32489, h: 281.15674 })).toEqual('#003264')
			expect(toHexColor(`lch(54.72 73.36 284.84)`)).toEqual('#0080ff')
		})
		test('Can convert RGB colors to LCH(ab)', () => {
			expectAllToBeClose(rgbaToLchab({ r: 0, g: 0, b: 0 }), { l: 0, c: 0 })
			expectAllToBeClose(rgbaToLchab({ r: 119, g: 119, b: 119 }), { l: 50, c: 0 })
			expectAllToBeClose(rgbaToLchab({ r: 255, g: 255, b: 255 }), { l: 100, c: 0 })
			expectAllToBeClose(rgbaToLchab({ r: 0, g: 50, b: 100 }), { l: 20.83195, c: 34.32489, h: 281.15674 })
			expectAllToBeClose(rgbaToLchab({ r: 0, g: 128, b: 255 }), { l: 54.72, c: 73.36, h: 284.84 })
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

		function getLuminance(input: ColorInput) {
			return new TinyColor(input).getLuminance()
		}
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
})
