import { ColorInput, TinyColor } from '@ctrl/tinycolor'

export function multiplyAlpha(input: ColorInput, factor: number) {
	const color = new TinyColor(input)
	return toCssColor(color.setAlpha(minMaxRounded(color.getAlpha() * factor)))
}

export function lighten(input: ColorInput, amount: number) {
	const color = new TinyColor(input)
	const hsl = color.toHsl()
	const l = minMaxRounded(hsl.l)
	return toCssColor(new TinyColor({ ...hsl, l: minMaxRounded(l + l * amount) }))
}

export function darken(color: ColorInput, amount: number) {
	return lighten(color, -amount)
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
