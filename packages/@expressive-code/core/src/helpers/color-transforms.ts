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
export function setLuminance(input: ColorValue, targetLuminance: number) {
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
export function ensureColorContrastOnBackground(input: ColorValue, background: ColorValue, minContrast = 5.5, maxContrast = 22): string {
	return withParsedColor(input, (color) => {
		return withParsedColor(
			background,
			(backgroundColor) => {
				let newColor = toTinyColor(color)
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
			},
			color
		)
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

	return setAlpha(color, newAlpha)
}

function binarySearch({
	getValueFn,
	targetValue,
	preferHigher,
	tolerance = 0.1,
	low = 0,
	high = 1,
	minChangeFactor = 0.001,
	maxIterations = 25,
}: {
	getValueFn: (mid: number) => number
	targetValue: number
	/**
	 * Determines the preferred direction in relation to `targetValue`. Will be used in two cases:
	 * - The calculated value is within `tolerance` of `targetValue`.
	 * - The midpoint does not change enough between iterations anymore (see `minChangeFactor`).
	 *
	 * If undefined, the direction will not be taken into account.
	 */
	preferHigher?: boolean
	tolerance?: number
	low?: number
	high?: number
	/**
	 * If the midpoint changes less than `minChangeFactor * Math.abs(high - low)`
	 * between iterations, the search will stop as soon as the value returned by `getValueFn`
	 * is in the preferred direction in relation to `targetValue`.
	 */
	minChangeFactor?: number
	maxIterations?: number
}) {
	const epsilon = minChangeFactor * Math.abs(high - low)
	let iterations = 0
	let mid: number
	let lastMid: number | undefined

	while (((mid = (low + high) / 2), iterations < maxIterations)) {
		const currentValue = getValueFn(mid)

		const resultIsWithinTolerance = Math.abs(currentValue - targetValue) <= tolerance
		const resultIsInPreferredDirection = preferHigher === undefined ? true : preferHigher ? currentValue > targetValue : currentValue < targetValue
		const midChangedLessThanEpsilon = lastMid !== undefined && Math.abs(lastMid - mid) < epsilon

		if (resultIsInPreferredDirection && (resultIsWithinTolerance || midChangedLessThanEpsilon)) {
			return mid
		} else if (currentValue < targetValue) {
			low = mid
		} else {
			high = mid
		}

		iterations++
		lastMid = mid
	}

	return mid
}

function withParsedColor(input: ColorValue, transform: (color: TinyColor) => string, fallback?: ColorValue) {
	const color = toTinyColor(input)
	if (!color.isValid) {
		const fallbackOrInput = fallback !== undefined ? fallback : input
		return fallbackOrInput === undefined || typeof fallbackOrInput === 'string' ? fallbackOrInput : toHexColor(fallbackOrInput)
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
