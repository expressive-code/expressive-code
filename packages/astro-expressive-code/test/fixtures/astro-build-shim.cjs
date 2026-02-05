const os = require('node:os')

const originalCpus = os.cpus
os.cpus = () => {
	const cpus = originalCpus()
	if (Array.isArray(cpus) && cpus.length > 0) {
		return cpus
	}
	return [
		{
			model: 'unknown',
			speed: 0,
			times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 },
		},
	]
}
