import type { StarlightPlugin } from '@astrojs/starlight/types';
import { AstroError } from 'astro/errors';
import type { ProjectContext, StarlightLllmsTextOptions } from './types';

export default function starlightLlmsTxt(opts: StarlightLllmsTextOptions = {}): StarlightPlugin {
	return {
		name: 'starlight-llms-txt',
		hooks: {
			setup({ astroConfig, addIntegration, config }) {
				if (!astroConfig.site) {
					throw new AstroError(
						'`site` not set in Astro configuration',
						'The `starlight-llms-txt` plugin requires setting `site` in your Astro configuration file.'
					);
				}
				addIntegration({
					name: 'starlight-llms-txt',
					hooks: {
						'astro:config:setup'({ injectRoute, updateConfig }) {
							injectRoute({
								// @ts-ignore Ignore type mismatch
								entrypoint: new URL('./llms.txt.ts', import.meta.url),
								pattern: '/llms.txt',
							});
							injectRoute({
								// @ts-ignore Ignore type mismatch
								entrypoint: new URL('./llms-full.txt.ts', import.meta.url),
								pattern: '/llms-full.txt',
							});
							injectRoute({
								// @ts-ignore Ignore type mismatch
								entrypoint: new URL('./llms-small.txt.ts', import.meta.url),
								pattern: '/llms-small.txt',
							});

							const projectContext: ProjectContext = {
								base: astroConfig.base,
								title: opts.projectName ?? config.title,
								description: opts.description ?? config.description,
								details: opts.details,
								optionalLinks: opts.optionalLinks ?? [],
								minify: opts.minify ?? {},
								promote: opts.promote ?? ['index*', 'getting-started*', '!*/*'],
								demote: opts.demote ?? [],
								exclude: opts.exclude ?? [],
								defaultLocale: config.defaultLocale,
								locales: config.locales,
							};

							const modules = {
								'virtual:starlight-llms-txt/context': `export const starlightLllmsTxtContext = ${JSON.stringify(
									projectContext
								)}`,
							};
							/** Mapping names prefixed with `\0` to their original form. */
							const resolutionMap = Object.fromEntries(
								(Object.keys(modules) as (keyof typeof modules)[]).map((key) => [
									resolveVirtualModuleId(key),
									key,
								])
							);

							updateConfig({
								vite: {
									plugins: [
										{
											name: 'vite-plugin-starlight-llms-text',
											resolveId(id): string | void {
												if (id in modules) return resolveVirtualModuleId(id);
											},
											load(id): string | void {
												const resolution = resolutionMap[id];
												if (resolution) return modules[resolution];
											},
										},
									],
								},
							});
						},
					},
				});
			},
		},
	};
}

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`;
}
