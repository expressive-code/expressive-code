import { ColorInput, TinyColor } from '@ctrl/tinycolor'

/**
 * Overrides the alpha value of a color with the given value.
 * Values should be between 0 and 1.
 */
export function setAlpha(input: ColorInput, newAlpha: number) {
	const color = new TinyColor(input)
	return toCssColor(color.setAlpha(newAlpha))
}

/**
 * Multiplies the existing alpha value of a color with the given factor.
 * Automatically limits the resulting alpha value to the range 0 to 1.
 */
export function multiplyAlpha(input: ColorInput, factor: number) {
	const color = new TinyColor(input)
	return toCssColor(color.setAlpha(minMaxRounded(color.getAlpha() * factor)))
}

/**
 * Lightens a color by the given amount.
 * Automatically limits the resulting lightness value to the range 0 to 1.
 */
export function lighten(input: ColorInput, amount: number) {
	const color = new TinyColor(input)
	const hsl = color.toHsl()
	const l = minMaxRounded(hsl.l)
	return toCssColor(new TinyColor({ ...hsl, l: minMaxRounded(l + l * amount) }))
}

/**
 * Darkens a color by the given amount.
 * Automatically limits the resulting lightness value to the range 0 to 1.
 */
export function darken(input: ColorInput, amount: number) {
	return lighten(input, -amount)
}

/**
 * Mixes the second color into the first color by the given amount.
 * Amount should be between 0 and 1.
 */
export function mix(input: ColorInput, mixinInput: ColorInput, amount: number) {
	const color = new TinyColor(input)
	const mixinColor = new TinyColor(mixinInput)
	// TinyColor's mix() method expects a value between 0 and 100
	const mixAmount = minMaxRounded(amount * 100, 0, 100)
	return color.mix(mixinColor, mixAmount).toHexString()
}

function toCssColor(color: TinyColor) {
	return color.toHexShortString()
}

function roundFloat(number: number, decimalPoints: number): number {
	const decimal = Math.pow(10, decimalPoints)
	return Math.round(number * decimal) / decimal
}

function minMaxRounded(number: number, min = 0, max = 1, decimalPoints = 3) {
	return Math.max(min, Math.min(max, roundFloat(number, decimalPoints)))
}
