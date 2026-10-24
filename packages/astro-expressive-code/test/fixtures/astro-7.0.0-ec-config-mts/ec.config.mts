// Expressive Code only supports `ec.config.mjs`. Vite used to resolve this file for the
// `<Code>` component anyway, which made it use a different config than Markdown code blocks
// and link to a stylesheet that was never emitted (see #351).
export default {
	styleOverrides: {
		borderRadius: '0',
	},
}
