const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ['**/*.*', '!src/**/*.{ts,tsx}'],
  },
)
