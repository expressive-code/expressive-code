// @ts-check
import { defineConfig } from 'astro/config'
import { astroExpressiveCode } from 'astro-expressive-code'
import { getTestConfig } from '../astro-test-config.mjs'

// https://astro.build/config
export default defineConfig({
	integrations: [astroExpressiveCode()],
	...getTestConfig(),
})
