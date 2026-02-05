export function getTestConfig() {
	const hmrPort = Number(process.env.VITE_HMR_PORT || 0) || undefined
	if (!hmrPort) return {}
	return {
		vite: {
			server: {
				hmr: { port: hmrPort },
				ws: /** @type {false} */ (false),
			},
		},
	}
}
