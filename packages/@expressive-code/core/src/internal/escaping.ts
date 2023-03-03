export function escapeRegExp(input: string) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
