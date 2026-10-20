export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js', 'e2e/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly', innerWidth: 'readonly', innerHeight: 'readonly', devicePixelRatio: 'readonly', addEventListener: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', URL: 'readonly' } },
    rules: { 'no-unused-vars': 'warn', 'no-undef': 'error' },
  },
];
