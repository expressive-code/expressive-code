/// <reference types="../../docs/.astro/types.d.ts" />

declare module 'virtual:starlight-llms-txt/context' {
	export const starlightLllmsTxtContext: import('./types').ProjectContext;
}

declare module 'vfile' {
	interface DataMap {
		starlightLlmsTxt: {
			minify: boolean;
		};
	}
}
