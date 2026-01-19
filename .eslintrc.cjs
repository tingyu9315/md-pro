module.exports = {
  root: true,
  env: { browser: true, es2021: true, webextensions: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'unused-imports'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'unused-imports/no-unused-imports': 'error',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  ignorePatterns: ['dist', 'node_modules']
}