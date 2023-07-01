// Color types
type RgbaColor = {
	r: number
	g: number
	b: number
	a?: number | undefined
}

export type LabColor = {
	l: number
	a: number
	b: number
	alpha?: number | undefined
}

export type LchColor = {
	l: number
	c: number
	h: number
	alpha?: number | undefined
}

// White point constants
const refX = 95.047
const refY = 100.0
const refZ = 108.883

// Conversion functions
function rgbToXyz(rgb: { r: number; g: number; b: number }) {
	const correctGamma = (v: number) => {
		v /= 255
		return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
	}

	const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(correctGamma)

	return {
		x: (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100,
		y: (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100,
		z: (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100,
	}
}

function xyzToRgb(xyz: { x: number; y: number; z: number }) {
	const [x, y, z] = [xyz.x, xyz.y, xyz.z].map((v) => v / 100)

	const correctGamma = (v: number) => (v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v)

	return {
		r: Math.round(correctGamma(x * 3.2406 + y * -1.5372 + z * -0.4986) * 255),
		g: Math.round(correctGamma(x * -0.9689 + y * 1.8758 + z * 0.0415) * 255),
		b: Math.round(correctGamma(x * 0.0557 + y * -0.204 + z * 1.057) * 255),
	}
}

function xyzToLab(xyz: { x: number; y: number; z: number }) {
	const transform = (v: number) => (v > 0.008856 ? Math.pow(v, 1 / 3) : 7.787 * v + 16 / 116)

	const [trX, trY, trZ] = [xyz.x / refX, xyz.y / refY, xyz.z / refZ].map(transform)

	return {
		l: 116 * trY - 16,
		a: 500 * (trX - trY),
		b: 200 * (trY - trZ),
	}
}

function labToXyz(lab: { l: number; a: number; b: number }) {
	const y = (lab.l + 16) / 116
	const x = lab.a / 500 + y
	const z = y - lab.b / 200

	const transform = (v: number) => (v > 0.008856 ? Math.pow(v, 3) : (v - 16 / 116) / 7.787)

	return {
		x: transform(x) * refX,
		y: transform(y) * refY,
		z: transform(z) * refZ,
	}
}

export function lchToLab(lch: LchColor): LabColor {
	return {
		l: lch.l,
		a: lch.c * Math.cos((lch.h * Math.PI) / 180),
		b: lch.c * Math.sin((lch.h * Math.PI) / 180),
		alpha: lch.alpha,
	}
}

export function labToLch(lab: LabColor): LchColor {
	return {
		l: lab.l,
		c: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
		h: (Math.atan2(lab.b, lab.a) * 180) / Math.PI,
		alpha: lab.alpha,
	}
}

export function rgbaToLab(rgb: RgbaColor): LabColor {
	const xyz = rgbToXyz(rgb)
	return {
		...xyzToLab(xyz),
		alpha: rgb.a,
	}
}

export function labToRgba(lab: LabColor): RgbaColor {
	const xyz = labToXyz(lab)
	return {
		...xyzToRgb(xyz),
		a: lab.alpha,
	}
}

export function rgbaToLch(rgb: RgbaColor): LchColor {
	return labToLch(rgbaToLab(rgb))
}

export function lchToRgba(lch: LchColor): RgbaColor {
	return labToRgba(lchToLab(lch))
}

// Parsing functions
export function parseCssLabColor(labString: string): LabColor | undefined {
	const match = labString.match(/^lab\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i)

	if (!match) {
		return undefined
	}

	const [, l, a, b, alpha] = match

	return {
		l: parseCssValue(l, 0, 100, 1),
		a: parseCssValue(a, -125, 125, 1.25),
		b: parseCssValue(b, -125, 125, 1.25),
		alpha: alpha !== undefined ? parseCssValue(alpha, 0, 1, 0.01) : undefined,
	}
}

export function parseCssLchColor(lchString: string): LchColor | undefined {
	const match = lchString.match(/^lch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg)?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i)

	if (!match) {
		return undefined
	}

	const [, l, c, h, alpha] = match

	const parseAngle = (value: string): number => {
		const normalizedAngle = parseFloat(value) % 360
		return normalizedAngle < 0 ? normalizedAngle + 360 : normalizedAngle
	}

	return {
		l: parseCssValue(l, 0, 100, 1),
		c: parseCssValue(c, 0, 150, 1.5),
		h: parseAngle(h),
		alpha: alpha !== undefined ? parseCssValue(alpha, 0, 1, 0.01) : undefined,
	}
}

function parseCssValue(value: string, min: number, max: number, percentageScale: number): number {
	const isPercentage = value.endsWith('%')
	const floatValue = parseFloat(value)
	const convertedValue = isPercentage ? floatValue * percentageScale : floatValue
	return Math.max(min, Math.min(max, convertedValue))
}
