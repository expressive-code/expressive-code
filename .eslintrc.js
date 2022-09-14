module.exports = {
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.base.json', './packages/*/tsconfig.json'],
  },
  rules: {
    'prettier/prettier': 'warn',
    'no-console': 'off',
    'no-mixed-spaces-and-tabs': 'warn',
    'no-trailing-spaces': ['warn', { skipBlankLines: true, ignoreComments: true }],
    'no-empty': 'warn',
    'no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '^(home)$',
        argsIgnorePattern: '^(_.*?|e|newValue|params)$',
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
  },
  overrides: [
    {
      files: ['**/.*.js'],
      rules: {
        indent: ['warn', 2, { SwitchCase: 1 }],
      },
    },
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/recommended-requiring-type-checking'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-empty-function': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    {
      files: ['packages/**/test/*.js', 'packages/**/*.test.js'],
      globals: {
        globalThis: false, // false means read-only
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: ['**/node_modules/*', '**/dist/*'],
}
