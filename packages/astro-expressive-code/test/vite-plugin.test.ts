import { describe, expect, test, vi } from 'vitest'
import { vitePluginAstroExpressiveCode } from '../src/vite-plugin'

const ecConfigFileUrl = '/src/ec.config.mjs'

let importerAccessCount = 0

/**
 * Minimal stand-in for a Vite `ModuleNode` that counts `importers` accesses.
 * On real module graphs, reading `importers` is the expensive operation that
 * the hot update handler performs recursively.
 */
class FakeModuleNode {
	url: string
	importedBy: Set<FakeModuleNode>

	constructor(url: string, importedBy: FakeModuleNode[] = []) {
		this.url = url
		this.importedBy = new Set(importedBy)
	}

	get importers() {
		importerAccessCount++
		return this.importedBy
	}
}

describe('vitePluginAstroExpressiveCode', () => {
	describe('handleHotUpdate', () => {
		test('Restarts the dev server when the EC config file itself changed', async () => {
			const ecConfig = new FakeModuleNode(`${ecConfigFileUrl}?t=123`, [new FakeModuleNode('/src/pages/index.astro')])
			const server = createFakeServer()
			await callHandleHotUpdate([ecConfig], server)
			expect(server.restart).toHaveBeenCalledTimes(1)
		})

		test('Restarts the dev server when a changed module is imported by the EC config file', async () => {
			const ecConfig = new FakeModuleNode(ecConfigFileUrl, [new FakeModuleNode('/src/pages/index.astro')])
			const configHelper = new FakeModuleNode('/src/config-helper.ts', [ecConfig])
			const changedModule = new FakeModuleNode('/src/another-helper.ts', [configHelper])
			const server = createFakeServer()
			await callHandleHotUpdate([changedModule], server)
			expect(server.restart).toHaveBeenCalledTimes(1)
		})

		test('Does not restart the dev server when no importer within the depth limit is the EC config file', async () => {
			// Create a chain of importers that reaches the EC config file at depth 6,
			// which is beyond the limit checked by the handler
			const ecConfig = new FakeModuleNode(ecConfigFileUrl, [new FakeModuleNode('/src/pages/index.astro')])
			const importers = Array.from({ length: 5 }, (_, index) => new FakeModuleNode(`/src/importer-${index}.ts`))
			importers[0].importedBy.add(importers[1])
			importers[1].importedBy.add(importers[2])
			importers[2].importedBy.add(importers[3])
			importers[3].importedBy.add(importers[4])
			importers[4].importedBy.add(ecConfig)
			const changedModule = new FakeModuleNode('/src/changed.ts', [importers[0]])
			const server = createFakeServer()
			await callHandleHotUpdate([changedModule], server)
			expect(server.restart).not.toHaveBeenCalled()
		})

		test('Restarts the dev server when a module is reachable at a lower depth on a later path', async () => {
			// Create a shared module that can be reached through two importer paths:
			// a deep one that hits the depth limit and a shallow one that does not.
			// Traversal order reaches the module through the deep path first, which
			// must not prevent the shallow path from being explored as well.
			const ecConfig = new FakeModuleNode(ecConfigFileUrl, [new FakeModuleNode('/src/pages/index.astro')])
			const sharedModule = new FakeModuleNode('/src/shared.ts', [ecConfig])
			const deep1 = new FakeModuleNode('/src/deep-1.ts', [sharedModule])
			const deep2 = new FakeModuleNode('/src/deep-2.ts', [deep1])
			const deep3 = new FakeModuleNode('/src/deep-3.ts', [deep2])
			const deep4 = new FakeModuleNode('/src/deep-4.ts', [deep3])
			const shallow = new FakeModuleNode('/src/shallow.ts', [sharedModule])
			const changedModule = new FakeModuleNode('/src/changed.ts', [deep4, shallow])
			const server = createFakeServer()
			await callHandleHotUpdate([changedModule], server)
			expect(server.restart).toHaveBeenCalledTimes(1)
		})

		test('Handles circular importers without infinite recursion', async () => {
			const moduleA = new FakeModuleNode('/src/module-a.ts')
			const moduleB = new FakeModuleNode('/src/module-b.ts')
			moduleA.importedBy.add(moduleB)
			moduleB.importedBy.add(moduleA)
			const server = createFakeServer()
			await callHandleHotUpdate([moduleA], server)
			expect(server.restart).not.toHaveBeenCalled()
		})

		test('Visits each module only once even when it is reachable through many importer paths', async () => {
			// Create a module graph in which every module of each layer
			// is imported by all modules of the next layer, resulting in
			// an exponential number of distinct importer paths
			const layerSize = 8
			const layers: FakeModuleNode[][] = [[new FakeModuleNode('/src/changed.ts')]]
			for (let depth = 1; depth <= 5; depth++) {
				layers.push(Array.from({ length: layerSize }, (_, index) => new FakeModuleNode(`/src/layer-${depth}-${index}.ts`)))
			}
			for (let depth = 1; depth <= 5; depth++) {
				for (const module of layers[depth - 1]) {
					module.importedBy = new Set(layers[depth])
				}
			}
			importerAccessCount = 0
			const server = createFakeServer()
			await callHandleHotUpdate([layers[0][0]], server)
			expect(server.restart).not.toHaveBeenCalled()
			// Exploring each of the 41 modules only once needs about 300 importer set
			// accesses (one per importer edge), while the unbounded traversal performed over 70,000
			expect(importerAccessCount).toBeLessThan(500)
		})

		test('Does nothing when called without modules', async () => {
			const server = createFakeServer()
			await callHandleHotUpdate([], server)
			expect(server.restart).not.toHaveBeenCalled()
		})
	})
})

function createFakeServer() {
	return { restart: vi.fn() }
}

async function callHandleHotUpdate(modules: FakeModuleNode[], server: ReturnType<typeof createFakeServer>) {
	const plugins = vitePluginAstroExpressiveCode({
		styles: [],
		scripts: [],
		ecIntegrationOptions: {},
		processedEcConfig: {},
		astroConfig: {
			base: '/',
			root: new URL('file:///project/'),
			srcDir: new URL('file:///project/src/'),
		},
		command: 'dev',
	}) as unknown as { handleHotUpdate?: (context: { modules: FakeModuleNode[]; server: ReturnType<typeof createFakeServer> }) => Promise<void> }[]
	const handleHotUpdate = plugins[0].handleHotUpdate
	if (!handleHotUpdate) throw new Error('Expected the plugin to provide a handleHotUpdate hook')
	await handleHotUpdate({ modules, server })
}
