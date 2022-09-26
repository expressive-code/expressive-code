import { defineConfig } from 'vitest/config'
import { basename, dirname, join } from 'node:path'

export default defineConfig({
	test: {
		resolveSnapshotPath: (path, extension) => {
			const snapshotDir = join(dirname(path), '__snapshots__')
			const testFileName = basename(path)
			const snapshotFileName = `${testFileName}${testFileName.includes('.html.test') ? '.html' : extension}`
			return join(snapshotDir, snapshotFileName)
		},
	},
})
