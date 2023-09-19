import { Rgb, Hsl, Oklch, convertHslToRgb, convertRgbToHsl, convertLchToLab, convertLabToLch, convertOklabToRgb, convertRgbToOklab } from 'culori/fn'
import { bisect } from './search-algorithms'

/**
 * RGBA color space, with all color channels ranging from 0 to 255,
 * and alpha ranging from 0 to 1.
 */
export type RgbaColor = {
	r: number
	g: number
	b: number
	a?: number | undefined
}

/**
 * LAB color space, with all color channels ranging from 0 to 100,
 * and alpha ranging from 0 to 1.
 */
export type LabColor = {
	l: number
	a: number
	b: number
	alpha?: number | undefined
}

export type LchColor = {
	l: number
	c: number
	h: number | undefined
	alpha?: number | undefined
}

export { Hsl, Oklch }

// White point constants
export const D65 = [0.3127 / 0.329, 1, (1 - 0.3127 - 0.329) / 0.329]
export const D50 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585]
const m = [
	[3.240969941904521, -1.537383177570093, -0.498610760293],
	[-0.96924363628087, 1.87596750150772, 0.041555057407175],
	[0.055630079696993, -0.20397695888897, 1.056971514242878],
]
const minv = [
	[0.41239079926595, 0.35758433938387, 0.18048078840183],
	[0.21263900587151, 0.71516867876775, 0.072192315360733],
	[0.019330818715591, 0.11919477979462, 0.95053215224966],
]

function rgbToXyz(rgb: { r: number; g: number; b: number }) {
	const srgbToLinear = (v: number) => {
		v /= 255
		return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
	}

	const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(srgbToLinear)

	return {
		x: (r * minv[0][0] + g * minv[0][1] + b * minv[0][2]) * 100,
		y: (r * minv[1][0] + g * minv[1][1] + b * minv[1][2]) * 100,
		z: (r * minv[2][0] + g * minv[2][1] + b * minv[2][2]) * 100,
	}
}

function xyzToRgb(xyz: { x: number; y: number; z: number }) {
	const [x, y, z] = [xyz.x, xyz.y, xyz.z].map((v) => v / 100)

	const linearToSrgb = (v: number) => (v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v)

	const r = x * m[0][0] + y * m[0][1] + z * m[0][2]
	const g = x * m[1][0] + y * m[1][1] + z * m[1][2]
	const b = x * m[2][0] + y * m[2][1] + z * m[2][2]

	return {
		r: linearToSrgb(r) * 255,
		g: linearToSrgb(g) * 255,
		b: linearToSrgb(b) * 255,
	}
}

function xyzToLab(xyz: { x: number; y: number; z: number }, illuminant: number[] = D65) {
	const transform = (v: number, whitepoint: number) => {
		v /= 100
		v /= whitepoint
		return v > 0.008856 ? Math.cbrt(v) : 7.787037 * v + 16 / 116
	}

	const x = transform(xyz.x, illuminant[0])
	const y = transform(xyz.y, illuminant[1])
	const z = transform(xyz.z, illuminant[2])

	return {
		l: (1.16 * y - 0.16) * 100,
		a: 5 * (x - y) * 100,
		b: 2 * (y - z) * 100,
	}
}

function labToXyz(lab: { l: number; a: number; b: number }, illuminant: number[] = D65) {
	const [l, a, b] = [lab.l, lab.a, lab.b].map((v) => v / 100)

	const y = (l + 0.16) / 1.16
	const x = a / 5 + y
	const z = y - b / 2

	const transform = (v: number, whitepoint: number) => {
		const pow = Math.pow(v, 3)
		return (pow > 0.008856 ? pow : (v - 16 / 116) / 7.787037) * whitepoint
	}

	return {
		x: transform(x, illuminant[0]) * 100,
		y: transform(y, illuminant[1]) * 100,
		z: transform(z, illuminant[2]) * 100,
	}
}

function lchabToLab(lch: LchColor): LabColor {
	return {
		l: lch.l,
		a: lch.c * Math.cos(((lch.h ?? 0) * Math.PI) / 180),
		b: lch.c * Math.sin(((lch.h ?? 0) * Math.PI) / 180),
		alpha: lch.alpha,
	}
}

function labToLchab(lab: LabColor): LchColor {
	return {
		l: lab.l,
		c: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
		h: normalizeAngle((Math.atan2(lab.b, lab.a) * 180) / Math.PI),
		alpha: lab.alpha,
	}
}

export function rgbaToLab(rgb: RgbaColor, illuminant: number[] = D65): LabColor {
	const xyz = rgbToXyz(rgb)
	return {
		...xyzToLab(xyz, illuminant),
		alpha: rgb.a,
	}
}

export function labToRgba(lab: LabColor, illuminant: number[] = D65): RgbaColor {
	const xyz = labToXyz(lab, illuminant)
	return {
		...xyzToRgb(xyz),
		a: lab.alpha,
	}
}

export function rgbaToLchab(rgb: RgbaColor, illuminant: number[] = D65): LchColor {
	return labToLchab(rgbaToLab(rgb, illuminant))
}

export function lchabToRgba(lch: LchColor, illuminant: number[] = D65): RgbaColor {
	return labToRgba(lchabToLab(lch), illuminant)
}

function rgbaToCulori(rgba: RgbaColor): Rgb {
	const { r, g, b, a } = rgba
	return {
		mode: 'rgb',
		r: r / 255,
		g: g / 255,
		b: b / 255,
		...(a !== undefined && { alpha: a }),
	}
}

function rgbaFromCulori(culoriRgb: Rgb): RgbaColor {
	const { r, g, b, alpha } = culoriRgb
	return {
		r: r * 255,
		g: g * 255,
		b: b * 255,
		a: alpha,
	}
}

export function rgbaToHsl(input: RgbaColor): Hsl {
	return convertRgbToHsl(rgbaToCulori(input))
}

export function hslToRgba(input: Hsl): RgbaColor {
	return rgbaFromCulori(convertHslToRgb(input))
}

export function rgbaToOklch(input: RgbaColor): Oklch {
	const oklab = convertRgbToOklab(rgbaToCulori(input))
	return convertLabToLch(oklab, 'oklch')
}

export function oklchToRgba(input: Oklch, clampChroma = true): RgbaColor {
	const convert = (oklch: Oklch) => {
		// @ts-expect-error Types are missing the `mode` argument
		const oklab = convertLchToLab(oklch, 'oklab')
		const rgb = convertOklabToRgb(oklab)
		const minChannel = Math.min(rgb.r, rgb.g, rgb.b)
		const maxChannel = Math.max(rgb.r, rgb.g, rgb.b)
		const inGamut = minChannel >= 0 && maxChannel <= 1
		return {
			rgb,
			c: oklch.c,
			inGamut,
		}
	}
	let result = convert(input)
	// If the resulting RGB color is out of gamut (exceeds the RGB color space),
	// try to get it into gamut by reducing the chroma
	if (!result.inGamut && clampChroma) {
		// Check if the color can be brought into gamut by reducing the chroma
		result = convert({ ...input, c: 0 })
		if (result.inGamut) {
			// Yes, so perform the bisect method to find the maximum chroma
			// that is still in gamut
			const maxChromaInGamut = bisect({
				checkFn: (c) => convert({ ...input, c }).inGamut,
				low: 0,
				high: input.c,
				minChangeFactor: 0.0001,
			})
			result = convert({ ...input, c: maxChromaInGamut ?? 0 })
		}
	}
	return rgbaFromCulori(result.rgb)
}

function normalizeAngle(angle: number): number {
	angle %= 360
	return angle < 0 ? angle + 360 : angle
}

function parseAngle(value: string): number {
	return normalizeAngle(parseFloat(value))
}

// Parsing functions
export function parseCssLabColor(labString: string): LabColor | undefined {
	const match = labString.match(/^lab\(\s*([\d.]+%?)\s+(-?[\d.]+%?)\s+(-?[\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i)

	if (!match) {
		return undefined
	}

	const [, l, a, b, alpha] = match

	return {
		l: parseCssValue(l, 0, 100),
		a: parseCssValue(a, -125, 125),
		b: parseCssValue(b, -125, 125),
		alpha: alpha !== undefined ? parseCssValue(alpha, 0, 1) : undefined,
	}
}

export function parseCssLchColor(lchString: string): LchColor | undefined {
	const match = lchString.match(/^lch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg)?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i)

	if (!match) {
		return undefined
	}

	const [, l, c, h, alpha] = match

	return {
		l: parseCssValue(l, 0, 100),
		c: parseCssValue(c, 0, 150),
		h: parseAngle(h),
		alpha: alpha !== undefined ? parseCssValue(alpha, 0, 1) : undefined,
	}
}

export function parseCssOklchColor(oklchString: string): Oklch | undefined {
	const match = oklchString.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg)?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i)

	if (!match) {
		return undefined
	}

	const [, l, c, h, alpha] = match

	return {
		mode: 'oklch',
		l: parseCssValue(l, 0, 1),
		c: parseCssValue(c, 0, 0.5, 0.4),
		h: parseAngle(h),
		...(alpha !== undefined && { alpha: parseCssValue(alpha, 0, 1) }),
	}
}

function parseCssValue(value: string, min: number, max: number, valueFor100Percent?: number): number {
	const isPercentage = value.endsWith('%')
	const floatValue = parseFloat(value)
	const convertedValue = isPercentage ? (floatValue * (valueFor100Percent ?? max)) / 100 : floatValue
	return Math.max(min, Math.min(max, convertedValue))
}
