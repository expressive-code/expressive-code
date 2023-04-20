import { ColorInput, TinyColor, readability } from '@ctrl/tinycolor'

/**
 * Overrides the alpha value of a color with the given value.
 * Values should be between 0 and 1.
 */
export function setAlpha(input: ColorInput, newAlpha: number) {
	return withParsedColor(input, (color) => {
		return toCssColor(color.setAlpha(newAlpha))
	})
}

/**
 * Multiplies the existing alpha value of a color with the given factor.
 * Automatically limits the resulting alpha value to the range 0 to 1.
 */
export function multiplyAlpha(input: ColorInput, factor: number) {
	return withParsedColor(input, (color) => {
		return toCssColor(color.setAlpha(minMaxRounded(color.getAlpha() * factor)))
	})
}

/**
 * Mixes a color with white or black to achieve the desired luminance.
 * Luminance values should be between 0 and 1.
 */
export function setLuminance(input: ColorInput, luminance: number) {
	return withParsedColor(input, (color) => {
		const v = color.getLuminance()
		luminance = minMaxRounded(luminance)
		const prel = (v: number, a: number, b: number) => (v - a) / (b - a)
		if (luminance < v) {
			return mix('#000', color, prel(luminance, 0, v))
		}
		return mix('#fff', color, prel(luminance, 1, v))
	})
}

/**
 * Lightens a color by the given amount.
 * Automatically limits the resulting lightness value to the range 0 to 1.
 */
export function lighten(input: ColorInput, amount: number) {
	return withParsedColor(input, (color) => {
		const hsl = color.toHsl()
		const l = minMaxRounded(hsl.l)
		return toCssColor(new TinyColor({ ...hsl, l: minMaxRounded(l + l * amount) }))
	})
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
	return withParsedColor(input, (color) => {
		const mixinColor = new TinyColor(mixinInput)
		// TinyColor's mix() method expects a value between 0 and 100
		const mixAmount = minMaxRounded(amount * 100, 0, 100)
		return toCssColor(color.mix(mixinColor, mixAmount))
	})
}

/**
 * Computes how the first color would look on top of the second color.
 */
export function onBackground(input: ColorInput, background: ColorInput) {
	return withParsedColor(input, (color) => {
		const backgroundColor = new TinyColor(background)
		return toCssColor(color.onBackground(backgroundColor))
	})
}

export function getColorContrast(input: ColorInput, background: ColorInput) {
	const color = new TinyColor(input)
	const backgroundColor = new TinyColor(background)
	return readability(color, backgroundColor)
}

export function ensureReadableColorContrast(input: ColorInput, background: ColorInput, minContrast = 6): string {
	const color = new TinyColor(input)
	const backgroundColor = new TinyColor(background)
	const oldContrast = readability(color, backgroundColor)
	if (oldContrast >= minContrast) return toCssColor(color)

	const colorL = color.getLuminance()
	const bgL = backgroundColor.getLuminance()
	const lightenTargetL = (bgL + 0.05) * minContrast - 0.05
	const darkenTargetL = (bgL + 0.05) / minContrast - 0.05
	const lightenedColor = setLuminance(color, lightenTargetL)
	const darkenedColor = setLuminance(color, darkenTargetL)
	const lightenedContrast = readability(lightenedColor, backgroundColor)
	const darkenedContrast = readability(darkenedColor, backgroundColor)

	// If we couldn't improve the contrast, return the old color
	if (lightenedContrast <= oldContrast && darkenedContrast <= oldContrast) return toCssColor(color)

	// First try to achieve the desired minimum contrast without inverting
	if (colorL >= bgL && lightenedContrast >= minContrast) return lightenedColor
	if (colorL < bgL && darkenedContrast >= minContrast) return darkenedColor

	// If that didn't work, return the color that achieves the best contrast
	return lightenedContrast > darkenedContrast ? lightenedColor : darkenedColor
}

function withParsedColor(input: ColorInput, transform: (color: TinyColor) => string) {
	const color = new TinyColor(input)
	if (!color.isValid) {
		return input === undefined || typeof input === 'string' ? input : toCssColor(color)
	}
	return transform(color)
}

function toCssColor(color: TinyColor) {
	return color.toHexShortString()
}

export function toRgbaString(input: ColorInput) {
	const color = new TinyColor(input)
	return color.toRgbString().toLowerCase()
}

function roundFloat(number: number, decimalPoints: number): number {
	const decimal = Math.pow(10, decimalPoints)
	return Math.round(number * decimal) / decimal
}

function minMaxRounded(number: number, min = 0, max = 1, decimalPoints = 3) {
	return Math.max(min, Math.min(max, roundFloat(number, decimalPoints)))
}
