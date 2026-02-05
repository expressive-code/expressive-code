import js from '@eslint/js'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const globals = require('globals')
const tsParser = require('@typescript-eslint/parser')
const tseslint = require('@typescript-eslint/eslint-plugin')
const eslintPluginPrettier = require('eslint-plugin-prettier')
const eslintConfigPrettier = require('eslint-config-prettier')
const noOnlyTests = require('eslint-plugin-no-only-tests')

const tsTypeCheckedConfigs = tseslint.configs['flat/recommended-type-checked'].map((config) => ({
	...config,
	files: config.files ?? ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
}))

const baseRules = {
	'prettier/prettier': 'warn',
	'no-console': 'warn',
	'no-only-tests/no-only-tests': 'warn',
	'no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
	'no-trailing-spaces': ['warn', { skipBlankLines: true, ignoreComments: true }],
	'no-empty': 'warn',
	'no-unused-vars': [
		'warn',
		{
			argsIgnorePattern: '^(_.*?|e)$',
		},
	],
	'no-unused-private-class-members': 'warn',
	'no-invalid-this': 'warn',
	'consistent-this': ['warn', 'thisObj'],
	semi: ['warn', 'never'],
	quotes: ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
	'space-before-function-paren': [
		'warn',
		{
			named: 'never',
			anonymous: 'always',
			asyncArrow: 'always',
		},
	],
	'func-call-spacing': ['warn', 'never'],
	'comma-spacing': ['warn', { before: false, after: true }],
	indent: ['warn', 'tab', { SwitchCase: 1 }],
	'brace-style': ['warn', '1tbs'],
	'space-before-blocks': ['warn', 'always'],
	'keyword-spacing': 'warn',
}

const tsRules = {
	'@typescript-eslint/no-unused-vars': [
		'warn',
		{
			argsIgnorePattern: '^_',
			caughtErrorsIgnorePattern: '^_',
			destructuredArrayIgnorePattern: '^_',
		},
	],
	'@typescript-eslint/no-deprecated': 'warn',
	'@typescript-eslint/no-empty-function': 'warn',
	'@typescript-eslint/no-empty-object-type': ['warn', { allowInterfaces: 'with-single-extends' }],
	'@typescript-eslint/no-non-null-assertion': 'off',
	'@typescript-eslint/no-redundant-type-constituents': 'off',
}

export default [
	{
		ignores: ['**/dist/*', '**/node_modules/*', '**/.astro/**', '**/.next/**', '.changeset/*', '.github/*'],
	},
	js.configs.recommended,
	eslintConfigPrettier,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.es2021,
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			prettier: eslintPluginPrettier,
			'no-only-tests': noOnlyTests,
		},
		rules: baseRules,
	},
	{
		files: ['**/.*.js', '**/.*.cjs', '**/.*.mjs'],
		rules: {
			indent: ['warn', 2, { SwitchCase: 1 }],
		},
	},
	...tsTypeCheckedConfigs,
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.eslint.json',
				tsconfigRootDir: __dirname,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: tsRules,
	},
	{
		files: ['docs/**/*.ts', 'docs/**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './docs/tsconfig.json',
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
		},
	},
	{
		files: ['**/*.test-d.ts'],
		rules: {
			'@typescript-eslint/no-floating-promises': 'off',
		},
	},
	{
		files: ['packages/**/test/*.js', 'packages/**/*.test.js'],
		languageOptions: {
			globals: {
				globalThis: 'readonly',
			},
		},
		rules: {
			'no-console': 'off',
		},
	},
]
