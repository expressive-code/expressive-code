import { describe, expect, test } from 'vitest'
import { multiplyAlpha } from '../src/helpers/color-transforms'

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
})
