import { ColorInput, TinyColor, readability } from '@ctrl/tinycolor'
import { LabColor, LchColor, labToRgba, lchToRgba, parseCssLabColor, parseCssLchColor } from '../internal/color-spaces'

export type ColorValue = ColorInput | LabColor | LchColor

/**
 * Overrides the alpha value of a color with the given value.
 * Values should be between 0 and 1.
 */
export function setAlpha(input: ColorValue, newAlpha: number) {
	return withParsedColor(input, (color) => {
		return toHexColor(color.setAlpha(newAlpha))
	})
}

/**
 * Multiplies the existing alpha value of a color with the given factor.
 * Automatically limits the resulting alpha value to the range 0 to 1.
 */
export function multiplyAlpha(input: ColorValue, factor: number) {
	return withParsedColor(input, (color) => {
		return toHexColor(color.setAlpha(minMaxRounded(color.getAlpha() * factor)))
	})
}

/**
 * Mixes a color with white or black to achieve the desired luminance.
 * Luminance values should be between 0 and 1.
 */
export function setLuminance(input: ColorValue, luminance: number) {
	return withParsedColor(input, (color) => {
		const v = color.getLuminance()
		const mixColor = v < luminance ? '#fff' : '#000'
		const mixAmount = binarySearch({
			getValueFn: (amount) => {
				return color
					.clone()
					.mix(mixColor, amount * 100)
					.getLuminance()
			},
			targetValue: luminance,
		})
		return toHexColor(color.mix(mixColor, mixAmount * 100))
	})
}

/**
 * Lightens a color by the given amount.
 * Automatically limits the resulting lightness value to the range 0 to 1.
 */
export function lighten(input: ColorValue, amount: number) {
	return withParsedColor(input, (color) => {
		const hsl = color.toHsl()
		const l = minMaxRounded(hsl.l)
		return toHexColor(toTinyColor({ ...hsl, l: minMaxRounded(l + l * amount) }))
	})
}

/**
 * Darkens a color by the given amount.
 * Automatically limits the resulting lightness value to the range 0 to 1.
 */
export function darken(input: ColorValue, amount: number) {
	return lighten(input, -amount)
}

/**
 * Mixes the second color into the first color by the given amount.
 * Amount should be between 0 and 1.
 */
export function mix(input: ColorValue, mixinInput: ColorValue, amount: number) {
	return withParsedColor(input, (color) => {
		const mixinColor = toTinyColor(mixinInput)
		// TinyColor's mix() method expects a value between 0 and 100
		const mixAmount = minMaxRounded(amount * 100, 0, 100)
		return toHexColor(color.mix(mixinColor, mixAmount))
	})
}

/**
 * Computes how the first color would look on top of the second color.
 */
export function onBackground(input: ColorValue, background: ColorValue) {
	return withParsedColor(input, (color) => {
		const backgroundColor = toTinyColor(background)
		return toHexColor(color.onBackground(backgroundColor))
	})
}

export function getColorContrast(color1: ColorValue, color2: ColorValue) {
	const color = toTinyColor(color1)
	const backgroundColor = toTinyColor(color2)
	return readability(color, backgroundColor)
}

export function getColorContrastOnBackground(input: ColorValue, background: ColorValue) {
	const color = toTinyColor(input)
	const backgroundColor = toTinyColor(background)
	return readability(color.onBackground(backgroundColor), backgroundColor)
}

export function ensureColorContrastOnBackground(input: ColorValue, background: ColorValue, minContrast = 5.5, maxContrast = 22): string {
	return withParsedColor(input, (color) => {
		return withParsedColor(background, (backgroundColor) => {
			let newColor = color.clone()
			let curContrast = readability(newColor.onBackground(backgroundColor), backgroundColor)

			// If the current contrast is too low, check if we need to change the luminance
			if (curContrast < minContrast) {
				const contrastWithoutAlpha = readability(newColor, backgroundColor)
				if (contrastWithoutAlpha < minContrast) {
					// The contrast is also too low when fully opaque, so change the luminance
					newColor = toTinyColor(changeLuminanceToReachColorContrast(newColor, backgroundColor, minContrast))
					curContrast = readability(newColor.onBackground(backgroundColor), backgroundColor)
				}
			}

			// Try to modify the alpha value to reach the desired contrast
			if (curContrast < minContrast || curContrast > maxContrast) {
				newColor = toTinyColor(changeAlphaToReachColorContrast(newColor, backgroundColor, minContrast, maxContrast))
			}

			return toHexColor(newColor)
		})
	})
}

export function changeLuminanceToReachColorContrast(input1: ColorValue, input2: ColorValue, minContrast = 6): string {
	const color1 = toTinyColor(input1)
	const color2 = toTinyColor(input2)
	const oldContrast = readability(color1, color2)
	if (oldContrast >= minContrast) return toHexColor(color1)

	const color1L = color1.getLuminance()
	const color2L = color2.getLuminance()
	const lightenTargetL = (color2L + 0.05) * minContrast - 0.05
	const darkenTargetL = (color2L + 0.05) / minContrast - 0.05
	const lightenedColor = setLuminance(color1, lightenTargetL)
	const darkenedColor = setLuminance(color1, darkenTargetL)
	const lightenedContrast = readability(lightenedColor, color2)
	const darkenedContrast = readability(darkenedColor, color2)

	// If we couldn't improve the contrast, return the old color
	if (lightenedContrast <= oldContrast && darkenedContrast <= oldContrast) return toHexColor(color1)

	// First try to achieve the desired minimum contrast without inverting
	if (color1L >= color2L && lightenedContrast >= minContrast) return lightenedColor
	if (color1L < color2L && darkenedContrast >= minContrast) return darkenedColor

	// If that didn't work, return the color that achieves the best contrast
	return lightenedContrast > darkenedContrast ? lightenedColor : darkenedColor
}

export function changeAlphaToReachColorContrast(input: ColorValue, background: ColorValue, minContrast = 6, maxContrast = 22) {
	const color = toTinyColor(input)
	const backgroundColor = toTinyColor(background)
	const colorOnBackground = color.onBackground(backgroundColor)
	const curContrast = readability(colorOnBackground, backgroundColor)
	if (curContrast >= minContrast && curContrast <= maxContrast) return toHexColor(color)

	const newAlpha = binarySearch({
		getValueFn: (alpha) => {
			const newColor = color.clone().setAlpha(alpha).onBackground(backgroundColor)
			return readability(newColor, backgroundColor)
		},
		targetValue: maxContrast,
		low: 0.15,
		high: 1,
	})

	return setAlpha(color, newAlpha)
}

function binarySearch({
	getValueFn,
	targetValue,
	low = 0,
	high = 1,
	tolerance = 0.1,
	maxIterations = 25,
}: {
	getValueFn: (mid: number) => number
	targetValue: number
	low?: number
	high?: number
	tolerance?: number
	maxIterations?: number
}) {
	let iterations = 0
	let mid: number

	while (((mid = (low + high) / 2), iterations < maxIterations)) {
		const currentValue = getValueFn(mid)

		if (Math.abs(currentValue - targetValue) <= tolerance) {
			return mid
		} else if (currentValue < targetValue) {
			low = mid
		} else {
			high = mid
		}

		iterations++
	}

	return mid
}

function withParsedColor(input: ColorValue, transform: (color: TinyColor) => string) {
	const color = toTinyColor(input)
	if (!color.isValid) {
		return input === undefined || typeof input === 'string' ? input : toHexColor(color)
	}
	return transform(color)
}

function toTinyColor(input: ColorValue) {
	if (input instanceof TinyColor) {
		// We use this instead of clone() because clone performs unwanted rounding
		return new TinyColor(input.toHexShortString())
	}
	if (typeof input === 'string') {
		// Detect CSS lab() color notation as input and convert it to RGBA
		// as this color space is not supported by TinyColor yet
		const labColor = parseCssLabColor(input)
		if (labColor) {
			return new TinyColor(labToRgba(labColor))
		}
		// Detect CSS lch() color notation as input and convert it to RGBA
		// as this color space is not supported by TinyColor yet
		const lchColor = parseCssLchColor(input)
		if (lchColor) {
			return new TinyColor(lchToRgba(lchColor))
		}
	}
	if (typeof input === 'object') {
		// Detect lab color objects
		if ('l' in input && 'a' in input && 'b' in input) {
			return new TinyColor(labToRgba(input))
		}
		// Detect lch color objects
		if ('l' in input && 'c' in input && 'h' in input) {
			return new TinyColor(lchToRgba(input))
		}
	}
	return new TinyColor(input)
}

export function toHexColor(input: ColorValue) {
	const color = input instanceof TinyColor ? input : toTinyColor(input)
	return color.toHexShortString()
}

export function toRgbaString(input: ColorValue) {
	const color = input instanceof TinyColor ? input : toTinyColor(input)
	return color.toRgbString().toLowerCase()
}

function roundFloat(number: number, decimalPoints: number): number {
	const decimal = Math.pow(10, decimalPoints)
	return Math.round(number * decimal) / decimal
}

function minMaxRounded(number: number, min = 0, max = 1, decimalPoints = 3) {
	return Math.max(min, Math.min(max, roundFloat(number, decimalPoints)))
}
