const os = require('node:os')

const originalCpus = os.cpus
os.cpus = () => {
	const cpus = originalCpus()
	if (Array.isArray(cpus) && cpus.length > 0) {
		return cpus
	}
	// In some sandboxed/CI-like environments `os.cpus()` can be empty.
	// Older Astro versions then end up with an invalid concurrency of 0.
	// Return one synthetic CPU entry to keep build concurrency >= 1.
	return [
		{
			model: 'unknown',
			speed: 0,
			times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 },
		},
	]
}
