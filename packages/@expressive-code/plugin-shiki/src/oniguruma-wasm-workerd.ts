export function loadOnigurumaWasm() {
	// @ts-expect-error Shiki types this entry as raw WASM, but workerd imports it as a module.
	return import('shiki/onig.wasm')
}
