import { describe, ExpectStatic, test } from 'vitest'
import { basename, extname, join } from 'node:path'
import { build, Rollup } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { bundledThemes, bundledLanguagesInfo } from 'shiki'
import { bundleStats } from 'rollup-plugin-bundle-stats'

type BuildResult = Awaited<ReturnType<typeof buildFixture>>
type TestCase = [string, boolean?, number?]

describe('integration with shiki affect on ec bundle size', () => {
	/* EC Core Tests */
	test.for([['no-themes.ts'], ['with-themes.ts'], ['with-themes-dynamic.ts'], ['all-plugins.ts', true]] as TestCase[])(
		'rehype-ec-core - %s',
		async ([fileName, isFull, size], { expect }) => {
			const result = await buildFixture({
				fixtureDir: 'bundle-size/rehype-ec-core',
				entryPoint: fileName,
				outputDir: 'dist',
			})
			if (isFull) {
				assertFull(expect, result, false)
			} else {
				assertSnapshot(expect, result, false, size ?? 900000)
			}
		}
	)

	/* EC Tests */
	test.for(['no-themes.ts', 'with-themes.ts', 'with-themes-dynamic.ts', 'shiki-false.ts'])('rehype-ec - %s', async (fileName, { expect }) => {
		const result = await buildFixture({
			fixtureDir: 'bundle-size/rehype-ec',
			entryPoint: fileName,
			outputDir: 'dist',
		})
		assertFull(expect, result, false)
	})

	/* EC Bundle Tests */
	test.for([
		['no-themes.ts'],
		['with-themes.ts'],
		['with-themes-dynamic.ts'],
		['engine-javascript-compile.ts'],
		['engine-javascript-raw.ts'],
		['engine-oniguruma.ts'],
		['engine-all.ts', false, 1100000],
		['all-plugins.ts', true],
	] as TestCase[])('rehype-ec-core-bundle - %s', async ([fileName, isFull, size], { expect }) => {
		const result = await buildFixture({
			fixtureDir: 'bundle-size/rehype-ec-core-bundle',
			entryPoint: fileName,
			outputDir: 'dist',
		})
		if (isFull) {
			assertFull(expect, result, true)
		} else {
			assertSnapshot(expect, result, true, size ?? 900000)
		}
	})

	// /* EC Highlighter Tests */
	test.for([['no-themes.ts'], ['with-themes.ts'], ['with-themes-dynamic.ts'], ['all-plugins.ts', true]] as TestCase[])(
		'rehype-ec-core-highlighter - %s',
		async ([fileName, isFull, size], { expect }) => {
			const result = await buildFixture({
				fixtureDir: 'bundle-size/rehype-ec-core-highlighter',
				entryPoint: fileName,
				outputDir: 'dist',
			})
			if (isFull) {
				assertFull(expect, result, true)
			} else {
				assertSnapshot(expect, result, true, size ?? 900000)
			}
		}
	)
})

async function buildFixture({
	fixtureDir,
	outputDir = 'dist',
	entryPoint = 'index.ts',
	keepPreviousBuild = false,
}: {
	fixtureDir: string
	entryPoint: string
	outputDir?: string | undefined
	keepPreviousBuild?: boolean | undefined
}) {
	const fixturePath = join(__dirname, 'fixtures', fixtureDir)
	const moduleName = basename(entryPoint, extname(entryPoint))
	const outputDirPath = join(fixturePath, outputDir, moduleName)
	const reportDir = '.vite'
	const manifestFilePath = join(reportDir, 'manifest.json')
	const visualizerStatsFilePath = join(outputDirPath, reportDir, 'visualizer-stats.json')

	const buildResult = await build({
		root: fixturePath,
		plugins: [
			// Generate module graph via https://github.com/btd/rollup-plugin-visualizer
			//   - View JSON in <fixturePath>/dist/<moduleName>/.vite/visualizer-status.json
			//   - View HTML w/ rollup-plugin-visualizer CLI from within rehype-expressive-code directory (see https://github.com/btd/rollup-plugin-visualizer?tab=readme-ov-file#cli)
			//       npx rollup-plugin-visualizer <fixturePath>/dist/<moduleName>/.vite/visualizer-stats.json --template <template> --open
			//         NOTE: Within the web UI, you can apply an "Include" filter of "*/**/*shiki*/**/*" to see just the shiki modules
			//         eg., npx rollup-plugin-visualizer ./test/fixtures/bundle-size/rehype-ec-bundle/dist/with-themes/.vite/visualizer-stats.json --template treemap --open
			visualizer({
				filename: visualizerStatsFilePath,
				template: 'raw-data',
			}),
			// Generate stats summary via https://github.com/relative-ci/bundle-stats/tree/master/packages/rollup-plugin
			//   - View JSON in <fixturePath>/dist/<moduleName>/.vite/bundle-stats.json
			//   - View HTML in <fixturePath>/dist/<moduleName>/.vite/bundle-stats.html
			bundleStats({
				compare: false,
				json: true,
				html: true,
				outDir: reportDir,
			}),
		],
		build: {
			emptyOutDir: !keepPreviousBuild,
			target: ['esnext'],
			outDir: outputDirPath,
			manifest: manifestFilePath,
			lib: {
				entry: join(fixturePath, entryPoint),
				name: moduleName,
				fileName: moduleName,
				formats: ['es'],
			},
			rollupOptions: {
				output: {
					// generate a single chunk to simplify output from vite
					inlineDynamicImports: true,
					// required for rollup-plugin-bundle-stats See https://relative-ci.com/documentation/guides/vite-config
					assetFileNames: '[name].[hash][extname]',
					chunkFileNames: '[name].[hash].js', // rollup default is [name].js
					entryFileNames: '[name].[hash].js',
				},
			},
		},
	})

	const rollupOutputs = Array.isArray(buildResult) ? buildResult : ([buildResult] as Rollup.RollupOutput[])
	return collectModules(fixturePath, rollupOutputs)
}

function collectModules(fixturePath: string, rollupOutputs: Rollup.RollupOutput[]) {
	const modulesFromBuildResult = {
		modules: {
			shiki: {
				files: {
					bundle: {
						themes: new Set<string>(),
						langs: new Set<string>(),
						'langs-precompiled': new Set<string>(),
						engine: new Set<string>(),
					},
					other: new Set<string>(),
				},
				totalSize: 0,
			},
			ecPlugins: {
				'plugin-shiki': {
					files: new Set<string>(),
					totalSize: 0,
				},
				'plugin-frames': {
					files: new Set<string>(),
					totalSize: 0,
				},
				'plugin-text-markers': {
					files: new Set<string>(),
					totalSize: 0,
				},
			},
		},
		totalSize: 0,
	}

	for (const rollupOutput of rollupOutputs) {
		for (const output of rollupOutput.output) {
			if (output.type !== 'chunk') continue

			modulesFromBuildResult.totalSize += getByteSize(output.code)

			const isShikiModule = (id: string) => (id.includes('/shiki/') || id.includes('/@shikijs/')) && !id.includes(fixturePath)

			const extractShikiPath = (input: string) => {
				const match = input.match(/.*(?:\/@shikijs\/|\/shiki\/)/)
				if (!match || !match[0]) {
					throw new Error('No match found after /shiki/ or /@shikijs/')
				}
				return input.slice(match[0].length)
			}

			const processShikiModule = (id: string, module: Rollup.RenderedModule) => {
				// shiki uses unbuild which puts shared chunks in /shared/ folder so separate them so we don't treat those
				// chunks as langs/themes/engines. See https://github.com/unjs/unbuild/blob/a6570a57a58b223ba278e8129b07f46ff27e9293/src/builders/rollup/utils.ts#L52
				const match = id.match(/\/(langs|themes|langs-precompiled)\/|\/(engine)-(javascript|oniguruma)\/(?!.*\/shared\/)/i)
				const shikiPath = extractShikiPath(id)
				const category = (match?.[1] || match?.[2]) as keyof typeof modulesFromBuildResult.modules.shiki.files.bundle | undefined
				const engine = match?.[3]
				const value = category ? (engine === 'javascript' ? 'javascript:' + basename(shikiPath, extname(shikiPath)) : engine ?? basename(shikiPath, extname(shikiPath))) : shikiPath

				if (category) {
					modulesFromBuildResult.modules.shiki.files.bundle[category].add(value)
				} else {
					modulesFromBuildResult.modules.shiki.files.other.add(value)
				}
				modulesFromBuildResult.modules.shiki.totalSize += module.renderedLength
			}

			for (const [id, module] of Object.entries(output.modules)) {
				if (isShikiModule(id)) {
					processShikiModule(id, module)
					continue
				}

				const match = id.match(/\/(plugin-(?:shiki|frames|text-markers))\/(.*)/i)
				if (match) {
					const pluginName = match?.[1] as keyof typeof modulesFromBuildResult.modules.ecPlugins | undefined
					if (!pluginName) {
						throw new Error('No known plugin match found')
					}
					modulesFromBuildResult.modules.ecPlugins[pluginName].files.add(match[0])
					modulesFromBuildResult.modules.ecPlugins[pluginName].totalSize += module.renderedLength
				}
			}
		}
	}

	return sortNames(modulesFromBuildResult)
}

type Normalize<T> = T extends Set<infer U> ? Normalize<U>[] : T extends Array<infer U> ? Normalize<U>[] : T extends object ? { [K in keyof T]: Normalize<T[K]> } : T

function sortNames<T>(obj: T): Normalize<T> {
	if (obj instanceof Set || Array.isArray(obj)) {
		return Array.from(obj).map(sortNames).sort() as Normalize<T>
	} else if (obj !== null && typeof obj === 'object') {
		const result = {} as { [K in keyof T]: Normalize<T[K]> }
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				result[key] = sortNames(obj[key])
			}
		}
		return result as Normalize<T>
	}
	return obj as Normalize<T>
}

export function getByteSize(content: string): number {
	return !content ? 0 : Buffer.from(content).length
}

function assertSnapshot(expect: ExpectStatic, result: BuildResult, expectOther: boolean, expectSize: number) {
	expect(result.modules.shiki.files.bundle).toMatchSnapshot()
	expect(result.totalSize).toBeGreaterThan(0)
	expect(result.totalSize).toBeLessThan(expectSize)
	expect(Object.keys(result.modules.ecPlugins).length).toBe(3)
	expect(result.modules.ecPlugins['plugin-shiki'].files.length).toBe(expectOther ? 1 : 0) // chunk file only since core.ts is just a re-export of chunk
	expect(result.modules.ecPlugins['plugin-shiki'].totalSize).toBeLessThanOrEqual(expectOther ? 30000 : 0)
	expect(result.modules.ecPlugins['plugin-frames'].files.length).toBe(0)
	expect(result.modules.ecPlugins['plugin-frames'].totalSize).toBe(0)
	expect(result.modules.ecPlugins['plugin-text-markers'].files.length).toBe(0)
	expect(result.modules.ecPlugins['plugin-text-markers'].totalSize).toBe(0)
	// We do not snapshot other to avoid potential test failing as new versions of shiki
	// are released. We are mainly concerned with the langs/themes/engines so we snapshot
	// those and then ensure other doesn't become unreasonable.
	if (expectOther) {
		expect(result.modules.shiki.files.other.length).toBeGreaterThan(0)
		expect(result.modules.shiki.files.other.length).toBeLessThan(15)
	} else {
		expect(result.modules.shiki.files.other.length).toBe(0)
	}
}

const baseLangs = bundledLanguagesInfo.map((i) => i.id)
const themes = Object.keys(bundledThemes)
function assertFull(expect: ExpectStatic, result: BuildResult, isPluginShikiCore: boolean) {
	// We don't snapshot here because Shiki can evolve their full bundle
	// and we do not want test to break every time they change it. Instead,
	// we make sure we match what is in their current bundle. Since we are
	// identifying what's in our bundle using filenames, it won't include language
	// aliases so we only compare against the base languages. Additionally, due to bundling
	// and shared files across languages, we will have more files than languages
	// but we should have a file for every language.
	expect(result.modules.shiki.files.bundle.langs.length).toBeGreaterThan(baseLangs.length)
	expect(result.modules.shiki.files.bundle['langs-precompiled'].length).toBe(0)
	expect(result.modules.shiki.files.bundle.themes.length).toBe(themes.length)
	expect(result.modules.shiki.files.bundle.engine.length).toBe(isPluginShikiCore ? 1 : 2)
	expect(result.modules.shiki.files.other.length).toBeGreaterThan(0)
	expect(result.modules.shiki.files.other.length).toBeLessThan(15)
	expect(result.modules.ecPlugins['plugin-shiki'].files.length).toBe(isPluginShikiCore ? 1 : 2) // index.js if not core + chunk file
	expect(result.modules.ecPlugins['plugin-shiki'].totalSize).toBeLessThanOrEqual(10500000)
	expect(result.modules.ecPlugins['plugin-frames'].files.length).toBe(1)
	expect(result.modules.ecPlugins['plugin-frames'].totalSize).toBeLessThanOrEqual(30000)
	expect(result.modules.ecPlugins['plugin-text-markers'].files.length).toBe(1)
	expect(result.modules.ecPlugins['plugin-text-markers'].totalSize).toBeLessThanOrEqual(30000)
	expect(result.totalSize).toBeGreaterThan(0)
	expect(result.totalSize).toBeLessThan(10000000)
}
