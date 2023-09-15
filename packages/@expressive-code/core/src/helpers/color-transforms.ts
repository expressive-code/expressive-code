import { TinyColor, readability } from '@ctrl/tinycolor'
import {
	RgbaColor,
	Hsl,
	Oklch,
	hslToRgba,
	labToRgba,
	lchabToRgba,
	oklchToRgba,
	parseCssLabColor,
	parseCssLchColor,
	parseCssOklchColor,
	rgbaToOklch,
} from '../internal/color-spaces'
import { binarySearch } from '../internal/search-algorithms'

/**
 * Overrides the alpha value of a color with the given value.
 * Values should be between 0 and 1.
 */
export function setAlpha(input: string, newAlpha: number) {
	return withParsedColor(input, (color) => {
		return toHexColor(color.setAlpha(newAlpha))
	})
}

/**
 * Multiplies the existing alpha value of a color with the given factor.
 * Automatically limits the resulting alpha value to the range 0 to 1.
 */
export function multiplyAlpha(input: string, factor: number) {
	return withParsedColor(input, (color) => {
		return toHexColor(color.setAlpha(minMaxRounded(color.getAlpha() * factor)))
	})
}

/**
 * Returns the luminance of a color.
 * Luminance values are between 0 and 1.
 */
export function getLuminance(input: string) {
	return toTinyColor(input).getLuminance()
}

/**
 * Mixes a color with white or black to achieve the desired luminance.
 * Luminance values should be between 0 and 1.
 */
export function setLuminance(input: string, targetLuminance: number) {
	return withParsedColor(input, (color) => {
		targetLuminance = minMaxRounded(targetLuminance)
		const increasing = targetLuminance > color.getLuminance()
		const mixColor = increasing ? '#fff' : '#000'
		const mixAmount = binarySearch({
			getValueFn: (amount) => {
				return toTinyColor(color)
					.mix(mixColor, amount * 100)
					.getLuminance()
			},
			targetValue: targetLuminance,
			preferHigher: targetLuminance > 0 && targetLuminance < 1 ? increasing : undefined,
			tolerance: 1 / 256,
			// Ensure that the binary search range matches the luminance target direction
			low: increasing ? 0 : 1,
			high: increasing ? 1 : 0,
		})
		return toHexColor(color.mix(mixColor, mixAmount * 100))
	})
}

/**
 * Lightens a color by the given amount.
 * Automatically limits the resulting lightness value to the range 0 to 1.
 */
export function lighten(input: string, amount: number) {
	return withParsedColor(input, (color) => {
		const hsl = color.toHsl()
		const l = minMaxRounded(hsl.l)
		const { h, s, a: alpha } = hsl
		return toHexColor(toTinyColor({ mode: 'hsl', h, s, l: minMaxRounded(l + l * amount), alpha }))
	})
}

/**
 * Darkens a color by the given amount.
 * Automatically limits the resulting lightness value to the range 0 to 1.
 */
export function darken(input: string, amount: number) {
	return lighten(input, -amount)
}

/**
 * Mixes the second color into the first color by the given amount.
 * Amount should be between 0 and 1.
 */
export function mix(input: string, mixinInput: string, amount: number) {
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
export function onBackground(input: string, background: string) {
	return withParsedColor(
		input,
		(color) => {
			const backgroundColor = toTinyColor(background)
			return toHexColor(color.onBackground(backgroundColor))
		},
		background
	)
}

export function getColorContrast(color1: string, color2: string) {
	const color = toTinyColor(color1)
	const backgroundColor = toTinyColor(color2)
	return readability(color, backgroundColor)
}

export function getColorContrastOnBackground(input: string, background: string) {
	const color = toTinyColor(input)
	const backgroundColor = toTinyColor(background)
	return readability(color.onBackground(backgroundColor), backgroundColor)
}

/**
 * Modifies the luminance and/or the alpha value of a color to ensure its color contrast
 * on the given background color is within the given range.
 *
 * - If the contrast is too low, the luminance is either increased or decreased first,
 *   and then the alpha value is increased (if required).
 * - If the contrast is too high, only the alpha value is decreased.
 *
 * If the target contrast cannot be reached, the function will try to get as close as possible.
 */
export function ensureColorContrastOnBackground(input: string, background: string, minContrast = 5.5, maxContrast = 22): string {
	return withParsedColor(input, (color) => {
		return withParsedColor(
			background,
			(backgroundColor) => {
				const hexBackgroundColor = toHexColor(backgroundColor)
				let newColor = toTinyColor(color)
				let curContrast = readability(newColor.onBackground(backgroundColor), backgroundColor)

				// If the current contrast is too low, check if we need to change the luminance
				if (curContrast < minContrast) {
					const contrastWithoutAlpha = readability(newColor, backgroundColor)
					if (contrastWithoutAlpha < minContrast) {
						// The contrast is also too low when fully opaque, so change the luminance
						newColor = toTinyColor(changeLuminanceToReachColorContrast(toHexColor(newColor), hexBackgroundColor, minContrast))
						curContrast = readability(newColor.onBackground(backgroundColor), backgroundColor)
					}
				}

				// Try to modify the alpha value to reach the desired contrast
				if (curContrast < minContrast || curContrast > maxContrast) {
					newColor = toTinyColor(changeAlphaToReachColorContrast(toHexColor(newColor), hexBackgroundColor, minContrast, maxContrast))
				}

				return toHexColor(newColor)
			},
			toHexColor(color)
		)
	})
}

export function changeLuminanceToReachColorContrast(input1: string, input2: string, minContrast = 6): string {
	const color1 = toTinyColor(input1)
	const color2 = toTinyColor(input2)
	const oldContrast = readability(color1, color2)
	if (oldContrast >= minContrast) return toHexColor(color1)

	const color1L = color1.getLuminance()
	const color2L = color2.getLuminance()
	const lightenTargetL = (color2L + 0.05) * minContrast - 0.05
	const darkenTargetL = (color2L + 0.05) / minContrast - 0.05
	const lightenedColor = setLuminance(input1, lightenTargetL)
	const darkenedColor = setLuminance(input1, darkenTargetL)
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

export function changeAlphaToReachColorContrast(input: string, background: string, minContrast = 6, maxContrast = 22) {
	const color = toTinyColor(input)
	const backgroundColor = toTinyColor(background)
	const colorOnBackground = color.onBackground(backgroundColor)
	const curContrast = readability(colorOnBackground, backgroundColor)
	if (curContrast >= minContrast && curContrast <= maxContrast) return toHexColor(color)

	const newAlpha = binarySearch({
		getValueFn: (alpha) => {
			const newColor = toTinyColor(color).setAlpha(alpha)
			const onBg = newColor.onBackground(backgroundColor)
			const result = readability(onBg, backgroundColor)
			return result
		},
		targetValue: curContrast < minContrast ? minContrast : maxContrast,
		preferHigher: curContrast < minContrast,
		tolerance: 1 / 256,
		low: 0.15,
		high: 1,
	})

	return setAlpha(toHexColor(color), newAlpha)
}

export type ChromaticRecolorTarget = {
	/**
	 * The target hue in degrees (0 – 360).
	 */
	hue: number
	/**
	 * The target chroma (0 – 0.4).
	 *
	 * If the input color's lightness is very high, the resulting chroma may be lower
	 * than this value. This avoids results that appear too saturated in comparison
	 * to the input color.
	 */
	chroma: number
	/**
	 * The lightness (0 – 1) that the target chroma was measured at.
	 *
	 * If given, the chroma will be adjusted relative to this lightness
	 * before applying it to the input color.
	 */
	chromaMeasuredAtLightness?: number | undefined
}

/**
 * Adjusts the input color based on the given target color while keeping
 * the input lightness unchanged. Uses the OKLCH color space to ensure
 * the resulting color is perceptually similar to the input color.
 *
 * The target color can either be defined as a string (e.g. a hex color),
 * or as an object with `hue` and `chroma`.
 *
 * Note that the resulting color's chroma may be lower than the target value
 * for input colors with very high lightness. This avoids results
 * that appear too saturated in comparison to the input color.
 */
export function chromaticRecolor(input: string, target: string | ChromaticRecolorTarget) {
	let targetHue: number
	let targetChroma: number
	let targetChromaMeasuredAtLightness: number | undefined
	if (typeof target === 'string') {
		const targetOklch = rgbaToOklch(toTinyColor(target))
		targetHue = targetOklch.h ?? 0
		targetChroma = targetOklch.c
		targetChromaMeasuredAtLightness = targetOklch.l
	} else {
		targetHue = target.hue
		targetChroma = target.chroma
		targetChromaMeasuredAtLightness = target.chromaMeasuredAtLightness
	}
	return withParsedColor(input, (color) => {
		const oklch = rgbaToOklch(color)

		// Set new hue
		oklch.h = targetHue

		// Determine the maximum chroma for the input lightness
		const maxChromaForInputLightness = rgbaToOklch(oklchToRgba({ ...oklch, c: 0.4 })).c

		// Calculate new chroma
		let newChroma: number
		if (targetChromaMeasuredAtLightness !== undefined) {
			// As the target color's lightness was given, we can use it to calculate
			// its relative chroma, and apply the same factor to the input lightness
			const maxChromaForTargetLightness = rgbaToOklch(oklchToRgba({ ...oklch, c: 0.4, l: targetChromaMeasuredAtLightness })).c
			const relativeTargetChroma = Math.min(targetChroma, maxChromaForTargetLightness) / maxChromaForTargetLightness
			newChroma = maxChromaForInputLightness * relativeTargetChroma
		} else {
			// As the target color's lightness was not given, we can only
			// clamp the target chroma to the maximum value for the input lightness
			newChroma = Math.min(targetChroma, maxChromaForInputLightness)
		}

		// Avoid too high chroma values for very light colors
		const linearDecrease = (i: number, start: number, end: number) => Math.max(0, Math.min(1, 1 - (i - start) / (end - start)))
		// const lowLightnessFactor = (1 - 0.6) + linearDecrease(oklch.l, 0.5, 0.3) * 0.6
		const highLightnessFactor = linearDecrease(oklch.l, 0.95, 0.99)
		oklch.c = newChroma * highLightnessFactor

		return toHexColor(toTinyColor(oklchToRgba(oklch, true)))
	})
}

function withParsedColor(input: string, transform: (color: TinyColor) => string, fallback?: string) {
	const color = input && toTinyColor(input)
	if (!color || !color.isValid) {
		const fallbackOrInput = fallback !== undefined ? fallback : input
		return !fallbackOrInput || typeof fallbackOrInput === 'string' ? fallbackOrInput : toHexColor(fallbackOrInput)
	}
	return transform(color)
}

function toTinyColor(input: string | TinyColor | RgbaColor | Hsl | Oklch) {
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
			return new TinyColor(lchabToRgba(lchColor))
		}
		// Detect CSS oklch() color notation as input and convert it to RGBA
		// as this color space is not supported by TinyColor yet
		const oklchColor = parseCssOklchColor(input)
		if (oklchColor) {
			return new TinyColor(oklchToRgba(oklchColor))
		}
		return new TinyColor(input)
	}
	// Detect known color object types
	if (typeof input === 'object' && 'mode' in input) {
		// HSL
		if (input.mode === 'hsl') return new TinyColor(hslToRgba(input))
		// OKLCH
		if (input.mode === 'oklch') return new TinyColor(oklchToRgba(input))
	}
	return new TinyColor(input)
}

export function toHexColor(input: TinyColor | string) {
	const color = input instanceof TinyColor ? input : toTinyColor(input)
	return color.toHexShortString()
}

export function toRgbaString(input: string) {
	return toTinyColor(input).toRgbString().toLowerCase()
}

function roundFloat(number: number, decimalPoints: number): number {
	const decimal = Math.pow(10, decimalPoints)
	return Math.round(number * decimal) / decimal
}

function minMaxRounded(number: number, min = 0, max = 1, decimalPoints = 3) {
	return Math.max(min, Math.min(max, roundFloat(number, decimalPoints)))
}
