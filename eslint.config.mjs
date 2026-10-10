export default [
  { ignores: ['.git/**', '.runs/**', 'dist/**', 'node_modules/**', 'evaluation/proof-of-work/**'] },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      globals: Object.fromEntries(['process', 'console', 'Buffer', 'fetch', 'AbortSignal', 'URL', 'setTimeout', 'clearTimeout', 'setImmediate', 'structuredClone'].map(name => [name, 'readonly']))
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-undef': 'error', 'no-duplicate-imports': 'error', 'no-unreachable': 'error',
      'no-dupe-args': 'error', 'no-dupe-keys': 'error', 'no-dupe-else-if': 'error',
      'no-async-promise-executor': 'error', 'no-promise-executor-return': 'error',
      'no-constant-condition': 'error', 'no-empty': ['error', { allowEmptyCatch: true }],
      'valid-typeof': 'error', 'eqeqeq': 'error', 'prefer-const': 'error'
    }
  }
];
